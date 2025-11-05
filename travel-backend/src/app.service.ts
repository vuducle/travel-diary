import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>TWICE x2</title>
  <style>
    :root{--bg1:#f7f8ff;--bg2:#e8f0ff;--card:#ffffff}
    html,body{height:100%;margin:0}
    body{display:flex;align-items:center;justify-content:center;background:linear-gradient(135deg,var(--bg1),var(--bg2));font-family:Inter,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#102a43}
    .card{background:var(--card);padding:28px;border-radius:14px;box-shadow:0 8px 30px rgba(16,42,67,0.08);max-width:820px;width:calc(100% - 40px);text-align:center}
    h1{margin:0 0 8px;font-size:28px;letter-spacing:0.6px}
    p{margin:0 0 16px;color:#334155}
    .gallery{display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-bottom:14px}
    .avatar{width:180px;height:180px;object-fit:cover;border-radius:12px;border:1px solid rgba(0,0,0,0.06)}
    a.button{display:inline-block;margin-top:8px;padding:8px 14px;background:#2563eb;color:#fff;border-radius:8px;text-decoration:none}
    @media (max-width:520px){.avatar{width:120px;height:120px}}
  </style>
</head>
<body>
  <div class="card">
    <h1>TWICE x2</h1>
    <p>Welcome — a small showcase. Click below to explore the API.</p>
    <div class="gallery">
      <img class="avatar" src="https://media3.giphy.com/media/v1.Y2lkPTc5MGI3NjExOXlka2ltYzI3cnoxejN5bWJoZXl3ZXV3NGYya2R1b3l6Yzhqc28wayZlcD12MV9pbnRlcm5hbF9naWZfYnlfaWQmY3Q9Zw/worHx2DK7pfHABT4u5/giphy.gif" alt="TWICE member 1" />
      <img class="avatar" src="https://media.giphy.com/media/v1.Y2lkPTc5MGI3NjExNjZ4YmhneHEwaWV2aDVyaHd4OGdybndjZDlmZnRoaDBwaWhzOXdmdyZlcD12MV9naWZzX3NlYXJjaCZjdD1n/Jmg0OCeHfE2YUb88ct/giphy.gif" alt="TWICE member 2" />
    </div>
    <a class="button" href="/api">Go to /api</a>
  </div>
</body>
</html>`;
  }
}
