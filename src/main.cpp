#include "crow.h"
#include <filesystem>
#include <fstream>
#include <sstream>
#include <string>
#include <cmath>
#include <iostream>

namespace fs = std::filesystem;

// Helper to round to 2 decimal places (standard financial representation)
inline double round2(double val) {
    return std::round(val * 100.0) / 100.0;
}

// Locate the public static files directory across various runtime environments
fs::path resolve_public_dir() {
    std::vector<fs::path> candidates = {
        fs::current_path() / "public",
        fs::current_path() / ".." / "public",
        fs::current_path() / "paypal-calculator" / "public",
        "h:/Paypal_Calculator/public"
    };

    for (const auto& dir : candidates) {
        if (fs::exists(dir / "index.html")) {
            return fs::canonical(dir);
        }
    }
    return fs::current_path() / "public";
}

// MIME type detection
std::string get_mime_type(const std::string& path_str) {
    auto dot_pos = path_str.rfind('.');
    if (dot_pos == std::string::npos) {
        return "text/plain";
    }
    std::string ext = path_str.substr(dot_pos);
    if (ext == ".html" || ext == ".htm") return "text/html; charset=utf-8";
    if (ext == ".css")  return "text/css; charset=utf-8";
    if (ext == ".js")   return "application/javascript; charset=utf-8";
    if (ext == ".svg")  return "image/svg+xml";
    if (ext == ".ico")  return "image/x-icon";
    if (ext == ".json") return "application/json; charset=utf-8";
    if (ext == ".png")  return "image/png";
    if (ext == ".jpg" || ext == ".jpeg") return "image/jpeg";
    return "application/octet-stream";
}

// Helper to serve a static file from disk
crow::response serve_file(const fs::path& public_dir, const std::string& filename) {
    fs::path full_path = public_dir / filename;

    // Security check: prevent directory traversal
    try {
        auto canonical_public = fs::canonical(public_dir);
        auto canonical_target = fs::canonical(full_path);
        auto [t_end, p_end] = std::mismatch(canonical_public.begin(), canonical_public.end(),
                                            canonical_target.begin(), canonical_target.end());
        if (t_end != canonical_public.end()) {
            return crow::response(403, "Access Forbidden");
        }
    } catch (...) {
        return crow::response(404, "File Not Found");
    }

    if (!fs::exists(full_path) || fs::is_directory(full_path)) {
        return crow::response(404, "File Not Found");
    }

    std::ifstream file(full_path, std::ios::binary);
    if (!file.is_open()) {
        return crow::response(500, "Internal Server Error: Unable to read file");
    }

    std::ostringstream ss;
    ss << file.rdbuf();
    std::string content = ss.str();

    crow::response res(200, content);
    res.set_header("Content-Type", get_mime_type(filename));
    res.set_header("Cache-Control", "no-cache");
    return res;
}

int main() {
    crow::SimpleApp app;
    crow::logger::setLogLevel(crow::LogLevel::Info);

    const fs::path public_dir = resolve_public_dir();
    std::cout << "[PayPal Calculator] Static asset directory: " << public_dir << std::endl;

    // 1. GET / -> Serve public/index.html
    CROW_ROUTE(app, "/")
    ([&public_dir]() {
        return serve_file(public_dir, "index.html");
    });

    // 2. GET /<filename> -> Serve static files (style.css, script.js, etc.)
    CROW_ROUTE(app, "/<string>")
    ([&public_dir](const std::string& filename) {
        return serve_file(public_dir, filename);
    });

    // 3. POST /api/calculate -> Calculate PayPal Fee
    // Formula: Fee = (amount * 0.034) + 0.30, Total = amount + Fee
    CROW_ROUTE(app, "/api/calculate")
    .methods(crow::HTTPMethod::POST)
    ([](const crow::request& req) {
        auto json_body = crow::json::load(req.body);
        if (!json_body) {
            crow::json::wvalue err_res;
            err_res["error"] = "Invalid JSON payload";
            return crow::response(400, err_res);
        }

        if (!json_body.has("amount")) {
            crow::json::wvalue err_res;
            err_res["error"] = "Missing 'amount' field in request";
            return crow::response(400, err_res);
        }

        double amount = 0.0;
        try {
            amount = json_body["amount"].d();
        } catch (...) {
            crow::json::wvalue err_res;
            err_res["error"] = "'amount' must be a valid number";
            return crow::response(400, err_res);
        }

        if (amount <= 0.0) {
            crow::json::wvalue err_res;
            err_res["error"] = "'amount' must be greater than zero";
            return crow::response(400, err_res);
        }

        // PayPal Fee Calculation:
        // Fee = (amount * 0.034) + 0.30
        // Net = amount - Fee
        // Total = amount + Fee
        double fee = round2((amount * 0.034) + 0.30);
        double net = round2(amount - fee);
        double total = round2(amount + fee);
        double rounded_amount = round2(amount);

        crow::json::wvalue result;
        result["amount"] = rounded_amount;
        result["fee"] = fee;
        result["net"] = net;
        result["total"] = total;

        crow::response res(200, result);
        res.set_header("Content-Type", "application/json");
        return res;
    });

    const uint16_t port = 8080;
    std::cout << "[PayPal Calculator] Starting Crow server on http://localhost:" << port << std::endl;

    app.port(port)
       .multithreaded()
       .run();

    return 0;
}
