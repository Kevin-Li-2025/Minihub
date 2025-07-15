# Quick Start Guide: MiniHub Setup

This guide will walk you through the steps to get the MiniHub application running locally on your machine for development and testing.

---

## 1. Prerequisites

Before you begin, ensure you have the following installed:

-   **Node.js**: Version 18.x or higher.
-   **npm**: Version 9.x or higher (usually comes with Node.js).
-   **MongoDB**: A running instance of MongoDB. You can use a local installation or a free cloud instance from [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register).

---

## 2. Clone the Repository

First, clone the project repository from GitHub to your local machine:

```bash
git clone https://github.com/Kevin-Li-2025/Minihub.git
cd Minihub
```

---

## 3. Configure Environment Variables

The server requires a database connection string and a JWT secret. You will need to set these up. While you can set them directly in your terminal, creating a `.env` file is recommended for managing them.

1.  Navigate to the `server` directory:
    ```bash
    cd server
    ```
2.  Create a new file named `.env`:
    ```bash
    touch .env
    ```
3.  Open the `.env` file and add the following variables, replacing the placeholder values with your own:

    ```
    # MongoDB Connection URI
    MONGODB_URI=mongodb://localhost:27017/minihub

    # JWT Secret for signing tokens (use a long, random string)
    JWT_SECRET=your-super-secret-and-long-jwt-key

    # The port for the backend server (optional, defaults to 3001)
    PORT=3001
    ```

---

## 4. Install Dependencies

You need to install dependencies for both the `server` and the `client` applications.

-   **Install Server Dependencies:**
    ```bash
    # From the /server directory
    npm install
    ```

-   **Install Client Dependencies:**
    ```bash
    # Navigate to the /client directory from the root
    cd ../client
    npm install
    ```

---

## 5. Run the Application

Now you can start the development servers for both the backend and frontend. It's best to run them in separate terminal windows.

-   **Start the Backend Server:**
    ```bash
    # From the /server directory
    npm start
    ```
    > ✅ The backend API will be running at `http://localhost:3001`.

-   **Start the Frontend Client:**
    ```bash
    # From the /client directory
    npm run dev
    ```
    > ✅ The frontend application will be running at `http://localhost:5173`.

---

You are now all set up! Open your browser and navigate to `http://localhost:5173` to use MiniHub.
