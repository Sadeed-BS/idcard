# SEDS CUSAT - Student Management API Documentation

**Version:** 1.0.0

**Base URL:** `http://localhost:5000`

## 1. Introduction

Welcome to the official API for the SEDS CUSAT Student Management System. This API provides a secure and efficient way to manage student registrations, profiles, and administrative tasks.

The system is built on a role-based architecture:
*   **Students**: Can manage their own profiles and access their digital ID cards.
*   **Admins**: Have full administrative control over all student records.

This document provides a complete reference for all available API endpoints.

## 2. Authentication

The API uses a two-step authentication process powered by **Google OAuth 2.0** and **JSON Web Tokens (JWT)**.

#### Step 1: Getting a Token via Google OAuth 2.0

To get a token, the user **must** be redirected to a specific Google login URL from a web browser. This is not a standard API call you make from Postman; it's a browser navigation. The API provides two endpoints to initiate this flow, one for students and one for admins.

After a user successfully signs in with Google, the server will handle the callback and respond with a JSON object containing the JWT token.

#### Step 2: Using the JWT Bearer Token

Once you have the JWT, you must include it in the `Authorization` header for all subsequent requests to protected endpoints. The scheme is `Bearer`.

**Example Header:**

```Authorization: Bearer <your_jwt_token_here>```



## 3. Common Error Responses

The API uses standard HTTP status codes to indicate the success or failure of a request.

| Status Code | Meaning | Description |
| :--- | :--- | :--- |
| `200 OK` | The request was successful. | The response body will contain the requested data. |
| `201 Created` | A new resource has been successfully created. | |
| `400 Bad Request` | The server could not understand the request due to invalid syntax. | Often caused by missing required fields in the request body. |
| `401 Unauthorized` | Authentication failed. | The JWT is missing, expired, or invalid. |
| `403 Forbidden` | Access is denied. | You are authenticated but do not have the necessary role (e.g., a student trying to access an admin route). |
| `404 Not Found` | The requested resource could not be found. | The endpoint is wrong or the ID of the requested item does not exist. |
| `500 Internal Server Error` | A generic error message, given when an unexpected condition was encountered. | The server logs will contain more details about the crash. |

**Example Error Body:**
```json
{
    "msg": "Not authorized as an admin"
}
```

## 4. API Endpoints
### 4.1 Authentication Endpoints
These endpoints initiate the Google OAuth 2.0 login flow. They must be opened in a browser.

``` GET /api/students/auth/google ```

- Description: Initiates the login/registration process for a student. Redirects the user to the Google sign-in page. On success, the callback will issue a student-scoped JWT.
- Authorization: None (Public)

### 4.2 Student Endpoints (Student Role Required)

The following endpoints are accessible only by an authenticated student. A valid student JWT must be provided as a Bearer token.

``` GET /api/students/me ```

- Description: Retrieves the profile details of the currently logged-in student.
- Authorization: Student
- Success Response (200 OK)

```
{
    "_id": "68b3c3756f41f5e7695e3a3f",
    "googleId": "112233445566778899001",
    "name": "Jane Doe",
    "email": "jane.doe@example.com",
    "uniqueId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d",
    "age": 21,
    "phoneNumber": "5551234567",
    "passoutYear": 2024,
    "department": "Mechanical Engineering",
    "team": "Team C",
    "registrationDate": "2024-05-21T10:00:00.000Z"
}
```

``` PUT /api/students/me ```

- Description: Updates the profile of the currently logged-in student. Only the fields provided in the body will be updated.
- Authorization: Student
- Request Body (application/json):

```
{
    "department": "Information Technology",
    "team": "Team Nebula",
    "phoneNumber": "9876543210"
}
```
- Success Response (200 OK): Returns the complete, updated student object.

``` GET /api/students/me/qrcode ```

- Description: Generates and returns a unique QR code for the logged-in student. The QR code encodes the student's uniqueId.
- Authorization: Student
- Success Response (200 OK):

```
{
    "studentId": "68b3c3756f41f5e7695e3a3f",
    "studentName": "Jane Doe",
    "qrCode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJgAAACYCAY..."
}
```

### 4.3 Admin Endpoints (Admin Role Required)
The following endpoints provide full management capabilities and are accessible only by an authenticated admin. A valid admin JWT must be provided as a Bearer token

``` GET /api/students ```

- Description: Retrieves a list of all registered students.
- Authorization: Admin
- Success Response (200 OK): Returns an array of student objects.

``` GET /api/students/:id ```

- Description: Retrieves the complete profile of a single student by their unique MongoDB _id.
- Authorization: Admin
- URL Parameters:
    - id (string, required): The MongoDB _id of the student.
- Success Response (200 OK): Returns the full student object.
- Error Response (404 Not Found): If no student with the given id exists.

``` PUT /api/students/:id ```

- Description: Updates the details of a specific student.
- Authorization: Admin
- URL Parameters:
    - id (string, required): The MongoDB _id of the student.
- Request Body: Provide only the fields you wish to change.
```
{
    "department": "Computer Science",
    "team": "Team Alpha"
}
```
- Success Response (200 OK):
```
{
    "msg": "Student details updated successfully",
    "student": { ... } // The updated student object
}
```

``` DELETE /api/students/:id ```
- Description: Permanently deletes a student's record from the database.
- Authorization: Admin
- URL Parameters:
    - id (string, required): The MongoDB _id of the student.
- Success Response (200 OK):
```
{
    "msg": "Student removed successfully"
}
```

``` POST /api/students/verify ```

- Description: Verifies a student by their uniqueId (typically read from a scanned QR code).
- Authorization: Admin
- Request Body:
```
{
    "uniqueId": "a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d"
}
```
- Success Response (200 OK):
```
{
    "message": "Verification successful",
    "student": { ... } // The verified student's public data
}
```
- Error Response (404 Not Found): If the uniqueId is not found in the database.

``` POST /api/students/:id/send-id-card ```
- Description: Re-sends the digital ID card to a student's registered email address. This is an action endpoint and does not require a request body.
- Authorization: Admin
- URL Parameters:
    - id (string, required): The MongoDB _id of the student.
- Success Response (200 OK):
```
{
    "msg": "ID card sent successfully to jane.doe@example.com"
}
```

``` GET /api/students/:id/qrcode ```

- Description: Generates and returns the QR code for a specific student.
- Authorization: Admin
- URL Parameters:
    - id (string, required): The MongoDB _id of the student.
- Success Response (200 OK): Returns the QR code data URL object.