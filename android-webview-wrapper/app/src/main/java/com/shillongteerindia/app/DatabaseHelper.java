package com.shillongteerindia.app;

import android.content.Context;
import android.database.sqlite.SQLiteDatabase;
import android.database.sqlite.SQLiteOpenHelper;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import org.json.JSONArray;
import org.json.JSONException;
import org.json.JSONObject;
import java.util.HashMap;
import java.util.Map;

/**
 * Helper class for managing local SQLite database.
 * This provides a bridge between the WebView JavaScript and native Android SQLite.
 */
public class DatabaseHelper extends SQLiteOpenHelper {
    private static final String DATABASE_NAME = "teerapp.db";
    private static final int DATABASE_VERSION = 1;
    private WebView webView;

    public DatabaseHelper(Context context) {
        super(context, DATABASE_NAME, null, DATABASE_VERSION);
    }

    /**
     * Attaches this database helper to a WebView.
     */
    public void attachToWebView(WebView webView) {
        this.webView = webView;
        webView.addJavascriptInterface(new DatabaseInterface(), "SQLiteDB");
    }

    @Override
    public void onCreate(SQLiteDatabase db) {
        // Create tables for offline data storage
        db.execSQL("CREATE TABLE IF NOT EXISTS users (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "username TEXT NOT NULL UNIQUE," +
                "password TEXT NOT NULL," +
                "balance REAL DEFAULT 0," +
                "role TEXT DEFAULT 'user'," +
                "created_at TEXT" +
                ")");

        db.execSQL("CREATE TABLE IF NOT EXISTS bets (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "user_id INTEGER NOT NULL," +
                "amount REAL NOT NULL," +
                "numbers TEXT NOT NULL," +
                "round INTEGER NOT NULL," +
                "date TEXT NOT NULL," +
                "status TEXT DEFAULT 'pending'," +
                "created_at TEXT," +
                "FOREIGN KEY (user_id) REFERENCES users(id)" +
                ")");

        db.execSQL("CREATE TABLE IF NOT EXISTS results (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "date TEXT NOT NULL UNIQUE," +
                "first_round TEXT," +
                "second_round TEXT," +
                "created_at TEXT," +
                "updated_at TEXT" +
                ")");

        db.execSQL("CREATE TABLE IF NOT EXISTS transactions (" +
                "id INTEGER PRIMARY KEY AUTOINCREMENT," +
                "user_id INTEGER NOT NULL," +
                "amount REAL NOT NULL," +
                "type TEXT NOT NULL," +
                "description TEXT," +
                "date TEXT NOT NULL," +
                "created_at TEXT," +
                "FOREIGN KEY (user_id) REFERENCES users(id)" +
                ")");
    }

    @Override
    public void onUpgrade(SQLiteDatabase db, int oldVersion, int newVersion) {
        // Handle database schema upgrades here
        if (oldVersion < 2) {
            // Upgrade to version 2 schema
        }
    }

    /**
     * JavaScript interface for accessing SQLite database from WebView
     */
    public class DatabaseInterface {
        /**
         * Execute a SQL query and return the results as JSON
         */
        @JavascriptInterface
        public String executeQuery(String query, String paramsJson) {
            SQLiteDatabase db = getReadableDatabase();
            Map<String, Object> result = new HashMap<>();
            
            try {
                JSONArray params = new JSONArray(paramsJson);
                // Use params to create prepared statement
                
                // This is a simplified implementation
                // In a real app, you would use prepared statements and handle different query types
                
                result.put("success", true);
                result.put("data", new JSONArray().toString());
                
            } catch (JSONException e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } finally {
                db.close();
            }
            
            try {
                return new JSONObject(result).toString();
            } catch (JSONException e) {
                return "{\"success\": false, \"error\": \"JSON conversion error\"}";
            }
        }
        
        /**
         * Create a new user in the local database
         */
        @JavascriptInterface
        public String createUser(String username, String password) {
            SQLiteDatabase db = getWritableDatabase();
            Map<String, Object> result = new HashMap<>();
            
            try {
                // In a real app, you would hash the password
                db.execSQL(
                    "INSERT INTO users (username, password, created_at) VALUES (?, ?, datetime('now'))",
                    new Object[]{username, password}
                );
                result.put("success", true);
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } finally {
                db.close();
            }
            
            try {
                return new JSONObject(result).toString();
            } catch (JSONException e) {
                return "{\"success\": false, \"error\": \"JSON conversion error\"}";
            }
        }
        
        /**
         * Add a bet to the local database
         */
        @JavascriptInterface
        public String placeBet(int userId, double amount, String numbers, int round, String date) {
            SQLiteDatabase db = getWritableDatabase();
            Map<String, Object> result = new HashMap<>();
            
            try {
                db.execSQL(
                    "INSERT INTO bets (user_id, amount, numbers, round, date, created_at) " +
                    "VALUES (?, ?, ?, ?, ?, datetime('now'))",
                    new Object[]{userId, amount, numbers, round, date}
                );
                
                // Update user balance
                db.execSQL(
                    "UPDATE users SET balance = balance - ? WHERE id = ?",
                    new Object[]{amount, userId}
                );
                
                result.put("success", true);
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } finally {
                db.close();
            }
            
            try {
                return new JSONObject(result).toString();
            } catch (JSONException e) {
                return "{\"success\": false, \"error\": \"JSON conversion error\"}";
            }
        }
        
        /**
         * Save a result to the local database
         */
        @JavascriptInterface
        public String saveResult(String date, String firstRound, String secondRound) {
            SQLiteDatabase db = getWritableDatabase();
            Map<String, Object> result = new HashMap<>();
            
            try {
                db.execSQL(
                    "INSERT OR REPLACE INTO results (date, first_round, second_round, created_at, updated_at) " +
                    "VALUES (?, ?, ?, datetime('now'), datetime('now'))",
                    new Object[]{date, firstRound, secondRound}
                );
                
                result.put("success", true);
            } catch (Exception e) {
                result.put("success", false);
                result.put("error", e.getMessage());
            } finally {
                db.close();
            }
            
            try {
                return new JSONObject(result).toString();
            } catch (JSONException e) {
                return "{\"success\": false, \"error\": \"JSON conversion error\"}";
            }
        }
    }
}