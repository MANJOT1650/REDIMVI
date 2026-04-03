# 🎬 RedImVi - Advanced Media Transformation Engine

[![Full Stack](https://img.shields.io/badge/Full--Stack-Developer-blue.svg)](#)
[![Stack](https://img.shields.io/badge/Tech-React_%7C_Node_%7C_PostgreSQL-brightgreen.svg)](#)
[![Security](https://img.shields.io/badge/Security-JWT_Authed-orange.svg)](#)

**RedImVi** is a high-performance, full-stack media processing platform designed to provide seamless compression and format transformation for images and videos. Engineered with a focus on speed, precision, and privacy, it leverages industry-standard processing engines to deliver professional results through a sleek, modern interface.

---

## 🚀 Key Features

### �️ Image Intelligence
- **Intelligent Compression**: Binary search-based quality optimization to hit exact target file sizes.
- **Multi-Format Support**: Process PNG, JPG, JPEG, and WEBP.
- **Exif Preservation**: Automatic orientation correction via Sharp's rotation engine.

### 🎥 Video Engineering
- **Frame-Accurate Conversion**: High-speed format switching between MP4 and MKV using FFmpeg.
- **Dual Compression Modes**: 
  - **By Quality (CRF)**: Balance visual fidelity with file weight.
  - **By Target Size**: Automated bitrate calculation based on video duration and target MB.

### � Enterprise-Grade Core
- **JWT Authentication**: Secure user sessions with Bcrypt-protected credentials.
- **Stateful Management**: Persistent theme settings and secure local storage handling.
- **PostgreSQL Persistence**: Robust relational data storage for user profiles.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 18 with Vite (Ultra-fast HMR)
- **Routing**: React Router v6
- **Interaction**: Axios with custom interceptors
- **Aesthetics**: Vanilla CSS3 (Glassmorphism, CSS Variables, Keyframe Animations)

### Backend
- **Engine**: Node.js & Express.js
- **ORM**: Sequelize (PostgreSQL)
- **Image Processing**: Sharp (High-performance Node.js image processing)
- **Video Processing**: FFmpeg (via Fluent-FFmpeg)
- **Security**: JSON Web Tokens & BcryptJS

---

## 🏗️ System Architecture & Privacy

RedImVi is built with a **Zero-Persistence Policy** for user media:

1.  **Ingress**: Files are uploaded via Multer to a temporary secure directory.
2.  **Transformation**: Processing engines (Sharp/FFmpeg) perform requested operations.
3.  **Cleanup Phase 1**: Original source files are unlinked from the filesystem immediately after the output is generated or if an error occurs.
4.  **Cleanup Phase 2 (Automatic Destruct)**: Processed files are served via a dynamic download stream and are **permanently deleted** from the server the millisecond the download completes.

---

## 🚦 Getting Started

### Prerequisites
- Node.js (v16+)
- PostgreSQL (Local instance or Cloud provided)
- FFmpeg (Installed on system PATH)

### Installation

1. **Clone & Setup Backend**
   ```bash
   cd server
   npm install
   # Configure .env based on the template below
   npm start
   ```

2. **Setup Frontend**
   ```bash
   cd client
   npm install
   # Configure .env
   npm run dev
   ```

### Environment Configuration

**Server (.env)**
```ini
PORT=5000
DATABASE_URL=postgresql://<user>:<password>@<host>:<port>/<db>
JWT_SECRET=your_jwt_signing_key
NODE_ENV=development
```

**Client (.env)**
```ini
VITE_API_URL=http://localhost:5000/api
```

---

## 📡 API Reference

| Endpoint | Method | Auth | Description |
| :--- | :--- | :--- | :--- |
| `/api/auth/signup` | `POST` | Public | Register new developer account |
| `/api/auth/login` | `POST` | Public | Authenticate and retrieve Bearer token |
| `/api/compress/image` | `POST` | JWT | Process image with quality/size constraints |
| `/api/compress/video` | `POST` | JWT | Process video with CRF or Target Bitrate |
| `/api/compress/convert`| `POST` | JWT | Transform video container (MP4/MKV) |
| `/api/compress/download/:file`| `GET` | Public* | Secure file retrieval with auto-cleanup |

---

## 📂 Project Structure

```text
Redimvi/
├── client/              # React-Vite Frontend
│   ├── src/
│   │   ├── components/  # Reusable UI & Logic modules
│   │   ├── context/     # Global state management
│   │   └── api.js       # Axios configuration
├── server/              # Node.js REST API
│   ├── config/          # Database & Utility configs
│   ├── middleware/      # Auth & Global handlers
│   ├── models/          # Sequelize Schema definitions
│   ├── routes/          # Express API endpoints
│   └── uploads/         # Temporary processing buffer
└── start.bat            # Cross-service orchestrator (Windows)
```

---

## 📝 Developer Notes
- **Performance**: Sharp processing is multi-threaded by default, taking advantage of multi-core server CPUs.
- **Security**: Ensure `JWT_SECRET` is rotated in production environments.
- **Scalability**: The processing logic is decoupled from the storage, allowing for easy migration to S3/Cloud bucket processing if needed.

---
*Developed with Passion & Precision as a Full Stack Initiative.*
