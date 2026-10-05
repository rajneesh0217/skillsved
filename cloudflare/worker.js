export default {
    async fetch(request, env) {
        const url = new URL(request.url);

        if (url.pathname === "/api/health" && request.method === "GET") {
            return jsonResponse({
                status: "ok",
                service: "Skillsved API"
            });
        }

        if (url.pathname === "/api/contact" && request.method === "POST") {
            return handleContact(request, env);
        }

        if (
            url.pathname === "/api/admin/enquiries" &&
            request.method === "GET"
        ) {
return handleAdminEnquiries(request, env);
        }

        return jsonResponse(
            { detail: "Not found." },
            404
        );
    }
};

function jsonResponse(data, status = 200) {
    return new Response(JSON.stringify(data), {
        status,
        headers: {
            "Content-Type": "application/json; charset=UTF-8"
        }
    });
}

const ALLOWED_PROFILES = new Set([
    "Student",
    "Fresher",
    "Working Professional",
    "Career Break",
    "Other"
]);

const ALLOWED_PROGRAMS = new Set([
    "Data Analytics with GenAI & Agentic AI"
]);

const ALLOWED_EXPECTATIONS = new Set([
    "Salary Growth",
    "Upskilling",
    "Job Switch",
    "Start a Career in Data & AI",
    "Learning / Knowledge",
    "Other"
]);

async function handleContact(request, env) {
        const clientIP =
    request.headers.get("CF-Connecting-IP") || "unknown";

const rateLimitResult = await env.CONTACT_RATE_LIMITER.limit({
    key: `contact:${clientIP}`
});

    if (!rateLimitResult.success) {
        return jsonResponse(
            {
                detail: "Too many enquiry attempts. Please try again shortly."
            },
            429
        );
    }
    let payload;

    try {
        payload = await request.json();
    } catch {
        return jsonResponse(
            { detail: "Invalid request data." },
            400
        );
    }

    const name = String(payload.name || "").trim();
    const email = String(payload.email || "").trim().toLowerCase();
    const phone = String(payload.phone || "").trim();
    const program = String(payload.program || "").trim();
    const profile = String(payload.profile || "").trim();
    const city = String(payload.city || "").trim();
    const expectation = String(payload.expectation || "").trim();
    const message = String(payload.message || "").trim();
    const website = String(payload.website || "").trim();

    if (website) {
        return jsonResponse(
            { status: "success", message: "Enquiry received." },
            200
        );
    }

    if (name.length < 2 || name.length > 80) {
        return jsonResponse(
            { detail: "Please enter a valid name." },
            422
        );
    }

    if (!isValidEmail(email)) {
        return jsonResponse(
            { detail: "Please enter a valid email address." },
            422
        );
    }

    if (phone && !/^[0-9+\-\s()]{7,20}$/.test(phone)) {
        return jsonResponse(
            { detail: "Please enter a valid phone number." },
            422
        );
    }

    if (!ALLOWED_PROGRAMS.has(program)) {
        return jsonResponse(
            { detail: "Please select a valid program." },
            422
        );
    }

    if (!ALLOWED_PROFILES.has(profile)) {
        return jsonResponse(
            { detail: "Please select a valid profile." },
            422
        );
    }

    if (city.length < 2 || city.length > 80) {
        return jsonResponse(
            { detail: "Please enter a valid city." },
            422
        );
    }

    if (!ALLOWED_EXPECTATIONS.has(expectation)) {
        return jsonResponse(
            { detail: "Please select a valid expectation." },
            422
        );
    }

    if (message.length > 500) {
        return jsonResponse(
            { detail: "Message is too long." },
            422
        );
    }

    const createdAt = new Date().toISOString();

    try {
        const result = await env.DB
            .prepare(`
                INSERT INTO enquiries
                (
                    name,
                    email,
                    phone,
                    program,
                    profile,
                    city,
                    expectation,
                    message,
                    created_at
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
            `)
            .bind(
                name,
                email,
                phone,
                program,
                profile,
                city,
                expectation,
                message,
                createdAt
            )
            .run();

        return jsonResponse(
            {
                status: "success",
                message: "Enquiry received.",
                id: result.meta.last_row_id
            },
            201
        );
    } catch {
        return jsonResponse(
            {
                detail: "Unable to save your enquiry. Please try again."
            },
            500
        );
    }
}

function isValidEmail(email) {
    return (
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
        email.length <= 254
    );
}

async function handleAdminEnquiries(request, env) {
    const adminKey = request.headers.get("X-Admin-Key");

    if (!env.ADMIN_API_KEY) {
        return jsonResponse(
            { detail: "Admin access is not configured." },
            503
        );
    }

    if (!adminKey || adminKey !== env.ADMIN_API_KEY) {
        return jsonResponse(
            { detail: "Invalid admin credentials." },
            401
        );
    }

    try {
        const result = await env.DB
            .prepare(`
                SELECT
                    id,
                    name,
                    email,
                    phone,
                    program,
                    profile,
                    city,
                    expectation,
                    message,
                    created_at
                FROM enquiries
                ORDER BY id DESC
            `)
            .all();

        return jsonResponse({
            status: "success",
            count: result.results.length,
            enquiries: result.results
        });
    } catch {
        return jsonResponse(
            { detail: "Unable to load enquiries." },
            500
        );
    }
}