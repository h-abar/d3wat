# دليل النشر على السيرفر - Linux VPS

## المتطلبات
- سيرفر Linux (Ubuntu 22.04+)
- Docker و Docker Compose
- دومين (اختياري لكن مطلوب لـ HTTPS/WhatsApp)

## الخطوات

### 1. تثبيت Docker (إذا لم يكن مثبت)
```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER
```

### 2. رفع المشروع للسيرفر
```bash
# من جهازك المحلي
scp -r ./da3awat user@your-server-ip:/home/user/da3awat
```

### 3. إعداد البيئة
```bash
cd /home/user/da3awat
cp env.example .env
nano .env   # عدّل القيم حسب حسابك
```

### 4. تشغيل الاستيراد وبناء التطبيق
```bash
# تأكد من وجود ملفات Excel في المجلد
docker compose up -d --build
```

### 5. إعداد Nginx كـ Reverse Proxy (مع HTTPS)
```bash
sudo apt install nginx certbot python3-certbot-nginx

# إنشاء ملف الإعداد
sudo nano /etc/nginx/sites-available/da3awat
```

محتوى الملف:
```nginx
server {
    server_name your-domain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/da3awat /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx

# HTTPS مجاني
sudo certbot --nginx -d your-domain.com
```

### 6. التأكد من عمل النظام
- لوحة التحكم: `https://your-domain.com`
- ماسح الدعوات: `https://your-domain.com/scanner`
- دعوة تجريبية: `https://your-domain.com/invitation/[qr-code]`

### بدون Docker (طريقة بديلة)
```bash
# تثبيت Node.js 20
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

cd /home/user/da3awat
npm ci
npm run import    # استيراد البيانات
npm run build
npm start         # أو استخدم pm2:
# npm install -g pm2
# pm2 start npm --name da3awat -- start
# pm2 save
# pm2 startup
```
