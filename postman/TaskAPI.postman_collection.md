# TaskFlow API — Postman Collection

Save this file as `TaskAPI.postman_collection.json` and import into Postman.

```json
{
  "info": {
    "name": "TaskFlow API v1",
    "schema": "https://schema.getpostman.com/json/collection/v2.1.0/collection.json",
    "_postman_id": "taskflow-api-collection"
  },
  "variable": [
    { "key": "base_url", "value": "http://localhost:3001/api/v1", "type": "string" },
    { "key": "token",    "value": "",                             "type": "string" }
  ],
  "item": [
    {
      "name": "Health",
      "item": [
        {
          "name": "Health Check",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/health"
          }
        }
      ]
    },
    {
      "name": "Auth",
      "item": [
        {
          "name": "Register",
          "event": [{ "listen": "test", "script": { "exec": ["if(pm.response.code === 201){ pm.collectionVariables.set('token', pm.response.json().data.token); }"] } }],
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/register",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"email\": \"demo@example.com\",\n  \"username\": \"demouser\",\n  \"password\": \"password123\"\n}" }
          }
        },
        {
          "name": "Login",
          "event": [{ "listen": "test", "script": { "exec": ["if(pm.response.code === 200){ pm.collectionVariables.set('token', pm.response.json().data.token); }"] } }],
          "request": {
            "method": "POST",
            "url": "{{base_url}}/auth/login",
            "header": [{ "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"email\": \"demo@example.com\",\n  \"password\": \"password123\"\n}" }
          }
        },
        {
          "name": "Get Me",
          "request": {
            "method": "GET",
            "url": "{{base_url}}/auth/me",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }]
          }
        }
      ]
    },
    {
      "name": "Tasks",
      "item": [
        {
          "name": "List Tasks",
          "request": { "method": "GET", "url": { "raw": "{{base_url}}/tasks?page=1&limit=10", "query": [{"key":"page","value":"1"},{"key":"limit","value":"10"}] }, "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }] }
        },
        {
          "name": "Create Task",
          "request": {
            "method": "POST", "url": "{{base_url}}/tasks",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }, { "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"title\": \"My First Task\",\n  \"description\": \"Task description here\",\n  \"priority\": \"HIGH\",\n  \"status\": \"TODO\",\n  \"dueDate\": \"2026-12-31T00:00:00.000Z\"\n}" }
          }
        },
        {
          "name": "Get Task by ID",
          "request": { "method": "GET", "url": "{{base_url}}/tasks/:id", "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }] }
        },
        {
          "name": "Update Task",
          "request": {
            "method": "PUT", "url": "{{base_url}}/tasks/:id",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }, { "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{\n  \"status\": \"DONE\",\n  \"priority\": \"LOW\"\n}" }
          }
        },
        {
          "name": "Delete Task",
          "request": { "method": "DELETE", "url": "{{base_url}}/tasks/:id", "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }] }
        }
      ]
    },
    {
      "name": "Admin",
      "item": [
        {
          "name": "List All Users",
          "request": { "method": "GET", "url": "{{base_url}}/admin/users", "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }] }
        },
        {
          "name": "Change User Role",
          "request": {
            "method": "PATCH", "url": "{{base_url}}/admin/users/:id/role",
            "header": [{ "key": "Authorization", "value": "Bearer {{token}}" }, { "key": "Content-Type", "value": "application/json" }],
            "body": { "mode": "raw", "raw": "{ \"role\": \"ADMIN\" }" }
          }
        }
      ]
    }
  ]
}
```
