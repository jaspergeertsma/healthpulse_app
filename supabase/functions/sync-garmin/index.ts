// @ts-nocheck
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

var corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Garmin endpoints
var SSO_BASE = "https://sso.garmin.com/sso";
var SSO_EMBED = SSO_BASE + "/embed";
var SSO_SIGNIN = SSO_BASE + "/signin";
var CONNECT_API = "https://connectapi.garmin.com";
var CONNECT_BASE = "https://connect.garmin.com";
var WEIGHT_SERVICE = CONNECT_BASE + "/weight-service";
var OAUTH_CONSUMER_URL = "https://thegarth.s3.amazonaws.com/oauth_consumer.json";

var UA = "com.garmin.android.apps.connectmobile";

var EMBED_PARAMS = {
    id: "gauth-widget",
    embedWidget: "true",
    gauthHost: SSO_BASE,
};

var SIGNIN_PARAMS = {
    id: "gauth-widget",
    embedWidget: "true",
    gauthHost: SSO_EMBED,
    service: SSO_EMBED,
    source: SSO_EMBED,
    redirectAfterAccountLoginUrl: SSO_EMBED,
    redirectAfterAccountCreationUrl: SSO_EMBED,
};

function buildUrl(base, params) {
    return base + "?" + new URLSearchParams(params).toString();
}

function extractCookies(res) {
    try {
        var raw = res.headers.get("set-cookie") || "";
        if (!raw) return "";
        return raw.split(",").map(function (c) {
            return c.split(";")[0].trim();
        }).filter(Boolean).join("; ");
    } catch (e) {
        return "";
    }
}

function mergeCookies(existing, newCookies) {
    if (!newCookies) return existing;
    if (!existing) return newCookies;
    return existing + "; " + newCookies;
}

// ---- OAuth 1.0 Signing ----

function percentEncode(str) {
    return encodeURIComponent(str)
        .replace(/!/g, "%21")
        .replace(/\*/g, "%2A")
        .replace(/'/g, "%27")
        .replace(/\(/g, "%28")
        .replace(/\)/g, "%29");
}

function generateNonce() {
    var arr = new Uint8Array(16);
    crypto.getRandomValues(arr);
    var hex = "";
    for (var i = 0; i < arr.length; i++) {
        hex += arr[i].toString(16).padStart(2, "0");
    }
    return hex;
}

async function hmacSha1(key, message) {
    var encoder = new TextEncoder();
    var cryptoKey = await crypto.subtle.importKey(
        "raw",
        encoder.encode(key),
        { name: "HMAC", hash: "SHA-1" },
        false,
        ["sign"]
    );
    var signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message));
    // Base64 encode
    var bytes = new Uint8Array(signature);
    var binary = "";
    for (var i = 0; i < bytes.length; i++) {
        binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
}

async function oauthSign(method, url, params, consumerKey, consumerSecret, tokenKey, tokenSecret) {
    var oauthParams = {
        oauth_consumer_key: consumerKey,
        oauth_nonce: generateNonce(),
        oauth_signature_method: "HMAC-SHA1",
        oauth_timestamp: Math.floor(Date.now() / 1000).toString(),
        oauth_version: "1.0",
    };
    if (tokenKey) {
        oauthParams["oauth_token"] = tokenKey;
    }

    // Combine all params for signature base
    var allParams = {};
    for (var k in oauthParams) allParams[k] = oauthParams[k];
    if (params) {
        for (var k in params) allParams[k] = params[k];
    }

    // Also parse query string from URL
    var urlObj = new URL(url);
    urlObj.searchParams.forEach(function (v, k) {
        allParams[k] = v;
    });

    // Sort and encode
    var sortedKeys = Object.keys(allParams).sort();
    var paramPairs = sortedKeys.map(function (k) {
        return percentEncode(k) + "=" + percentEncode(allParams[k]);
    });
    var paramString = paramPairs.join("&");

    // Base URL (without query string)
    var baseUrl = urlObj.origin + urlObj.pathname;

    // Signature base string
    var sigBase = method.toUpperCase() + "&" + percentEncode(baseUrl) + "&" + percentEncode(paramString);

    // Signing key
    var sigKey = percentEncode(consumerSecret) + "&" + percentEncode(tokenSecret || "");

    // Sign
    var sig = await hmacSha1(sigKey, sigBase);
    oauthParams["oauth_signature"] = sig;

    // Build Authorization header
    var authParts = Object.keys(oauthParams).map(function (k) {
        return percentEncode(k) + '="' + percentEncode(oauthParams[k]) + '"';
    });

    return 'OAuth ' + authParts.join(", ");
}

// ---- Garmin SSO Login ----

async function garminLogin(email, password) {
    var cookies = "";

    console.log("Step 1: GET /sso/embed (set cookies)...");
    var embedRes = await fetch(buildUrl(SSO_EMBED, EMBED_PARAMS), {
        headers: { "User-Agent": UA },
        redirect: "manual",
    });
    cookies = mergeCookies(cookies, extractCookies(embedRes));

    console.log("Step 2: GET /sso/signin (get CSRF)...");
    var signinRes = await fetch(buildUrl(SSO_SIGNIN, SIGNIN_PARAMS), {
        headers: {
            "User-Agent": UA,
            "Cookie": cookies,
            "Referer": SSO_EMBED,
        },
        redirect: "manual",
    });
    cookies = mergeCookies(cookies, extractCookies(signinRes));
    var signinBody = await signinRes.text();
    var csrfMatch = signinBody.match(/name="_csrf"\s+value="([^"]+)"/);
    var csrf = csrfMatch ? csrfMatch[1] : "";
    console.log("  CSRF found:", !!csrf);

    console.log("Step 3: POST /sso/signin (login)...");
    var loginData = new URLSearchParams({
        username: email,
        password: password,
        embed: "true",
        _csrf: csrf,
    });

    var loginRes = await fetch(buildUrl(SSO_SIGNIN, SIGNIN_PARAMS), {
        method: "POST",
        headers: {
            "User-Agent": UA,
            "Content-Type": "application/x-www-form-urlencoded",
            "Cookie": cookies,
            "Referer": buildUrl(SSO_SIGNIN, SIGNIN_PARAMS),
        },
        body: loginData.toString(),
        redirect: "manual",
    });
    cookies = mergeCookies(cookies, extractCookies(loginRes));
    var loginBody = await loginRes.text();

    var titleMatch = loginBody.match(/<title>(.+?)<\/title>/);
    var title = titleMatch ? titleMatch[1] : "unknown";
    console.log("  Login title:", title);

    if (title.includes("MFA")) {
        throw new Error("MFA is enabled on your Garmin account. Please disable it or use app-based auth.");
    }
    if (title !== "Success") {
        throw new Error("Garmin login failed. Title: " + title);
    }

    // Extract ticket
    var ticketMatch = loginBody.match(/embed\?ticket=([^"]+)"/);
    if (!ticketMatch) {
        ticketMatch = loginBody.match(/ticket=([^"'\\&\s]+)/);
    }
    if (!ticketMatch) {
        throw new Error("Could not extract ticket from Garmin response.");
    }
    var ticket = ticketMatch[1];
    console.log("  Ticket:", ticket.substring(0, 20) + "...");

    return ticket;
}

// ---- OAuth Token Exchange (garth-style) ----

async function getOAuth1Token(ticket, consumerKey, consumerSecret) {
    console.log("Step 4: OAuth1 - exchange ticket for OAuth1 token...");

    var url = CONNECT_API + "/oauth-service/oauth/preauthorized"
        + "?ticket=" + ticket
        + "&login-url=" + encodeURIComponent(SSO_EMBED)
        + "&accepts-mfa-tokens=true";

    var authHeader = await oauthSign("GET", url, null, consumerKey, consumerSecret, null, null);

    var res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            "Authorization": authHeader,
        },
    });

    if (!res.ok) {
        var errText = await res.text();
        throw new Error("OAuth1 preauthorized failed (" + res.status + "): " + errText.substring(0, 200));
    }

    var text = await res.text();
    var parsed = {};
    var pairs = text.split("&");
    for (var i = 0; i < pairs.length; i++) {
        var kv = pairs[i].split("=");
        parsed[decodeURIComponent(kv[0])] = decodeURIComponent(kv[1] || "");
    }

    console.log("  Got OAuth1 token:", !!parsed.oauth_token);
    return parsed;
}

async function exchangeOAuth1ForOAuth2(oauth1, consumerKey, consumerSecret) {
    console.log("Step 5: OAuth2 - exchange OAuth1 for OAuth2 token...");

    var url = CONNECT_API + "/oauth-service/oauth/exchange/user/2.0";

    var authHeader = await oauthSign(
        "POST", url, null,
        consumerKey, consumerSecret,
        oauth1.oauth_token, oauth1.oauth_token_secret
    );

    var res = await fetch(url, {
        method: "POST",
        headers: {
            "User-Agent": UA,
            "Authorization": authHeader,
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: oauth1.mfa_token ? "mfa_token=" + oauth1.mfa_token : "",
    });

    if (!res.ok) {
        var errText = await res.text();
        throw new Error("OAuth2 exchange failed (" + res.status + "): " + errText.substring(0, 200));
    }

    var tokenData = await res.json();
    console.log("  Got OAuth2 access_token:", !!tokenData.access_token);
    return tokenData;
}

// ---- Garmin API Data Fetch ----

async function fetchWeightData(accessToken, startDate, endDate) {
    // garth uses connectapi.garmin.com with /weight-service/weight/range/{start}/{end}
    var url = CONNECT_API + "/weight-service/weight/range/" + startDate + "/" + endDate + "?includeAll=true";
    console.log("Fetching weight data:", url);

    var res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            "Accept": "application/json",
            "Authorization": "Bearer " + accessToken,
        },
    });

    if (!res.ok) {
        // Try fallback: older dateRange endpoint
        console.log("  Range endpoint failed (" + res.status + "), trying dateRange...");
        var fallbackUrl = CONNECT_API + "/weight-service/weight/dateRange?startDate=" + startDate + "&endDate=" + endDate;
        res = await fetch(fallbackUrl, {
            headers: {
                "User-Agent": UA,
                "Accept": "application/json",
                "Authorization": "Bearer " + accessToken,
            },
        });
    }

    if (!res.ok) {
        var errText = await res.text();
        throw new Error("Weight fetch failed (" + res.status + "): " + errText.substring(0, 200));
    }

    return await res.json();
}

async function fetchSleepData(accessToken, startDate, endDate) {
    // Garmin sleep daily summaries
    var url = CONNECT_API + "/wellness-service/wellness/dailySleepData/" + endDate;
    console.log("Fetching sleep data (latest):", url);

    var res = await fetch(url, {
        headers: {
            "User-Agent": UA,
            "Accept": "application/json",
            "Authorization": "Bearer " + accessToken,
        },
    });

    if (!res.ok) {
        console.log("  Sleep single date failed (" + res.status + "), trying list endpoint...");
    }

    var latestSleep = res.ok ? await res.json() : null;

    // Also fetch sleep list for date range
    var listUrl = CONNECT_API + "/wellness-service/wellness/dailySleep?startDate=" + startDate + "&endDate=" + endDate;
    console.log("Fetching sleep list:", listUrl);

    var listRes = await fetch(listUrl, {
        headers: {
            "User-Agent": UA,
            "Accept": "application/json",
            "Authorization": "Bearer " + accessToken,
        },
    });

    var sleepList = [];
    if (listRes.ok) {
        var listData = await listRes.json();
        console.log("Sleep List Response Keys:", Object.keys(listData || {}));

        if (Array.isArray(listData)) {
            sleepList = listData;
        } else if (listData && listData.dailySleepDTOList) {
            sleepList = listData.dailySleepDTOList;
        } else if (listData && listData.sleepDTOList) {
            sleepList = listData.sleepDTOList;
        } else {
            console.log("⚠️ Unknown sleep list structure. Body snippet:", JSON.stringify(listData).slice(0, 500));
        }
    } else {
        console.log("  Sleep list failed (" + listRes.status + ")");
        try {
            var err = await listRes.text();
            console.log("  Error body:", err.slice(0, 200));
        } catch (e) { }
    }

    // Merge latest into list if not already present
    if (latestSleep && latestSleep.calendarDate) {
        var found = false;
        for (var i = 0; i < sleepList.length; i++) {
            if (sleepList[i].calendarDate === latestSleep.calendarDate) {
                sleepList[i] = latestSleep;
                found = true;
                break;
            }
        }
        if (!found) sleepList.push(latestSleep);
    }

    console.log("Total sleep entries found:", sleepList.length);
    return sleepList;
}

// ---- Main Handler ----

Deno.serve(async function (req) {
    console.log("=== sync-garmin invoked ===");

    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    var startTime = Date.now();

    try {
        var garminEmail = Deno.env.get("GARMIN_EMAIL");
        var garminPassword = Deno.env.get("GARMIN_PASSWORD");
        var supabaseUrl = Deno.env.get("SUPABASE_URL");
        var supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

        console.log("Env check - GARMIN_EMAIL:", !!garminEmail, "GARMIN_PASSWORD:", !!garminPassword);

        if (!garminEmail || !garminPassword) {
            throw new Error("GARMIN_EMAIL and GARMIN_PASSWORD secrets are required");
        }

        // Parse body
        var days = 90;
        var userToken = null;
        try {
            var body = await req.json();
            if (body.days) days = parseInt(body.days);
            userToken = body.user_token || null;
        } catch (e) { }

        // Extract user ID
        var userId = null;
        if (userToken) {
            try {
                var payload = JSON.parse(atob(userToken.split(".")[1]));
                userId = payload.sub;
            } catch (e) { }
        }

        // Check for Service Role trigger (Cron Job)
        var authHeader = req.headers.get("Authorization") || "";
        var apiKeyHeader = req.headers.get("apikey") || "";

        // Match if either header contains the service key
        var isServiceTrigger = (supabaseServiceKey && (authHeader.includes(supabaseServiceKey) || apiKeyHeader === supabaseServiceKey));

        console.log("Auth Check - isServiceTrigger:", isServiceTrigger, "Has UserToken:", !!userToken);

        if (!userId && isServiceTrigger) {
            console.log("🤖 Automated trigger: Finding user to sync...");
            var tempClient = createClient(supabaseUrl, supabaseServiceKey);
            var { data: profiles, error: pError } = await tempClient.from("user_profile").select("id").limit(1);

            if (pError) console.error("Profile lookup error:", pError.message);

            if (profiles && profiles[0]) {
                userId = profiles[0].id;
                console.log("✅ Found user profile to sync:", userId);
            } else {
                console.warn("⚠️ No user profiles found in 'user_profile' table. Automated sync aborted.");
            }
        }

        if (!userId) {
            console.error("❌ Auth Failed: No userId resolved.");
            return new Response(
                JSON.stringify({ success: false, error: "Authentication required. No user resolved." }),
                { status: 401, headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) }
            );
        }

        // Get OAuth consumer credentials (from garth's public S3)
        console.log("Fetching OAuth consumer credentials...");
        var consumerRes = await fetch(OAUTH_CONSUMER_URL);
        var consumer = await consumerRes.json();
        console.log("  Consumer key:", consumer.consumer_key ? consumer.consumer_key.substring(0, 8) + "..." : "MISSING");

        // Login to Garmin SSO
        var ticket = await garminLogin(garminEmail, garminPassword);

        // Exchange ticket for OAuth1 token
        var oauth1 = await getOAuth1Token(ticket, consumer.consumer_key, consumer.consumer_secret);

        // Exchange OAuth1 for OAuth2 token
        var oauth2 = await exchangeOAuth1ForOAuth2(oauth1, consumer.consumer_key, consumer.consumer_secret);

        // Calculate date range
        var today = new Date();
        var startDate = new Date(today);
        startDate.setDate(startDate.getDate() - days);
        var start = startDate.toISOString().split("T")[0];
        var end = today.toISOString().split("T")[0];

        // Fetch weight data using OAuth2 Bearer token
        var weightData = await fetchWeightData(oauth2.access_token, start, end);
        console.log("Raw weight response keys:", Object.keys(weightData || {}));

        // Extract weight entries - handle both response formats
        var rawEntries = [];
        if (weightData && weightData.dailyWeightSummaries) {
            // Range endpoint format: dailyWeightSummaries[].allWeightMetrics[]
            for (var s = 0; s < weightData.dailyWeightSummaries.length; s++) {
                var summary = weightData.dailyWeightSummaries[s];
                if (summary.allWeightMetrics) {
                    for (var m = 0; m < summary.allWeightMetrics.length; m++) {
                        rawEntries.push(summary.allWeightMetrics[m]);
                    }
                }
            }
        } else if (weightData && weightData.dateWeightList) {
            // Older dateRange format: dateWeightList[]
            rawEntries = weightData.dateWeightList;
        }
        console.log("Raw weight entries found:", rawEntries.length);

        // Store in Supabase
        var supabase = createClient(supabaseUrl, supabaseServiceKey);
        var entriesSynced = 0;

        if (rawEntries.length > 0) {
            var entriesMap = {};
            for (var i = 0; i < rawEntries.length; i++) {
                var entry = rawEntries[i];
                if (entry.weight && entry.calendarDate) {
                    // Keep latest entry per date (overwrites earlier ones)
                    entriesMap[entry.calendarDate] = {
                        user_id: userId,
                        measured_at: entry.calendarDate,
                        weight: (entry.weight / 1000).toFixed(2),
                        bmi: entry.bmi || null,
                        body_fat: entry.bodyFatPercentage || entry.bodyFat || null,
                        muscle_mass: entry.muscleMass ? (entry.muscleMass / 1000).toFixed(2) : null,
                        bone_mass: entry.boneMass ? (entry.boneMass / 1000).toFixed(2) : null,
                        body_water: entry.bodyWater || null,
                        source: entry.sourceType || "GARMIN_INDEX",
                        raw_data: entry,
                    };
                }
            }
            var entries = Object.values(entriesMap);

            console.log("Upserting", entries.length, "unique entries (from", rawEntries.length, "raw)...");

            if (entries.length > 0) {
                var result = await supabase
                    .from("weight_entries")
                    .upsert(entries, { onConflict: "user_id,measured_at" });

                if (result.error) {
                    console.error("DB error:", JSON.stringify(result.error));
                    throw new Error("Database error: " + result.error.message);
                }
                entriesSynced = entries.length;
            }
        }

        // ---- Sync Sleep Data ----
        var sleepSynced = 0;
        try {
            var sleepEntries = await fetchSleepData(oauth2.access_token, start, end);
            console.log("Processing", sleepEntries.length, "sleep entries...");

            if (sleepEntries.length > 0) {
                var sleepRows = [];
                for (var si = 0; si < sleepEntries.length; si++) {
                    var s = sleepEntries[si];
                    if (!s.calendarDate) continue;

                    sleepRows.push({
                        user_id: userId,
                        calendar_date: s.calendarDate,
                        sleep_start: s.sleepStartTimestampGMT ? new Date(s.sleepStartTimestampGMT).toISOString() : null,
                        sleep_end: s.sleepEndTimestampGMT ? new Date(s.sleepEndTimestampGMT).toISOString() : null,
                        duration_seconds: s.sleepTimeSeconds || s.durationInSeconds || null,
                        deep_sleep_seconds: s.deepSleepSeconds || s.deepSleepDuration || 0,
                        light_sleep_seconds: s.lightSleepSeconds || s.lightSleepDuration || 0,
                        rem_sleep_seconds: s.remSleepSeconds || s.remSleepDuration || 0,
                        awake_seconds: s.awakeSleepSeconds || s.awakeDuration || 0,
                        sleep_score: s.sleepScores?.overall?.value || s.sleepScores?.totalScore || s.overallScore || null,
                        quality_score: s.sleepScores?.qualityOfSleep?.qualifierKey ? null : (s.sleepScores?.qualityOfSleep?.value || null),
                        duration_score: s.sleepScores?.sleepDuration?.value || null,
                        recovery_score: s.sleepScores?.recoveryScore?.value || s.sleepScores?.revitalizationScore?.value || null,
                        restfulness_score: s.sleepScores?.sleepRestfulness?.value || s.sleepScores?.restlessSleepScore?.value || null,
                        sleep_need_seconds: s.sleepNeed || s.sleepNeedInSeconds || s.dailySleepDTO?.sleepNeed || null,
                        sleep_debt_seconds: s.sleepDebt || s.sleepDebtInSeconds || null,
                        body_battery_change: s.bodyBatteryChange || null,
                        avg_spo2: s.averageSpO2Value || s.averageSPO2 || null,
                        avg_respiration: s.averageRespirationValue || s.avgRespirationRate || null,
                        avg_heart_rate: s.restingHeartRate || s.averageHeartRate || null,
                        lowest_heart_rate: s.lowestHeartRate || null,
                        avg_stress: s.averageStress || null,
                        source: 'GARMIN',
                        raw_data: s,
                    });
                }

                if (sleepRows.length > 0) {
                    console.log("Upserting", sleepRows.length, "sleep entries...");
                    var sleepResult = await supabase
                        .from("sleep_entries")
                        .upsert(sleepRows, { onConflict: "user_id,calendar_date" });

                    if (sleepResult.error) {
                        console.error("Sleep DB error:", JSON.stringify(sleepResult.error));
                    } else {
                        sleepSynced = sleepRows.length;
                    }
                }
            }
        } catch (sleepErr) {
            console.error("Sleep sync error (non-fatal):", sleepErr.message);
        }

        var totalSynced = entriesSynced + sleepSynced;
        var duration = Date.now() - startTime;
        await supabase.from("sync_log").insert({
            user_id: userId,
            status: "success",
            entries_synced: totalSynced,
            duration_ms: duration,
        });

        console.log("=== SUCCESS:", entriesSynced, "weight +", sleepSynced, "sleep entries in", duration, "ms ===");

        return new Response(
            JSON.stringify({ success: true, entriesSynced: entriesSynced, sleepSynced: sleepSynced, durationMs: duration }),
            { headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) }
        );

    } catch (error) {
        var dur = Date.now() - startTime;
        console.error("=== FAILED:", error.message, "===");

        return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: Object.assign({}, corsHeaders, { "Content-Type": "application/json" }) }
        );
    }
});
