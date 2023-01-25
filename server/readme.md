## Function of the code
Here resides the NodeJS code of the sever that: 

 - connects to a MySQL database (`main.js`)
 - receives HTTP requests from the APP to submit or update new ocurrences in the database (`servers/occurrences/index.js`)
 - receives the uploaded photos corresponding to the occurrences sent by the APP (`servers/photos/index.js`)
 - stores these photos, to be shown on the app or on the website (`servers/photos/index.js`)

The code also runs periodically to

 - mark entries in the database as deleted if pathnames of photos don't exist in the server drive (`routines/cleanBadPhotos`)
 - remove duplicated entries in database (`routines/removeDuplicates.js`)

The entry point of the server is `main.js`.
 
The server is receiving requests at https://servidor.nomeubairro.app/

## Nginx typical configuration

```nginx
server {
  server_name servidor.nomeubairro.app;
  client_max_body_size 50M;

  # APP in-my-district
  location ~ ^\/(|serverapp|serverapp_get_historic|resolvido\/.*)$ {
    proxy_pass http://localhost:3045;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $remote_addr;
    proxy_set_header X-Forwarded-Proto https;
  }

  # server for photos
  location = ^\/(serverapp_img_upload|image_server)$ {
    proxy_pass http://localhost:3046;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
    proxy_set_header X-Forwarded-For $remote_addr;
	}

  location = /robots.txt { 
    add_header Content-Type text/plain;
    return 200 "User-agent: *\nDisallow: /\n";
  }

  listen 443 ssl; # managed by Certbot
  ssl_certificate /etc/letsencrypt/live/servidor.nomeubairro.app/fullchain.pem; # managed by Certbot
  ssl_certificate_key /etc/letsencrypt/live/servidor.nomeubairro.app/privkey.pem; # managed by Certbot
  include /etc/letsencrypt/options-ssl-nginx.conf; # managed by Certbot
  ssl_dhparam /etc/letsencrypt/ssl-dhparams.pem; # managed by Certbot
}

server {
  if ($host = servidor.nomeubairro.app) {
    return 301 https://$host$request_uri;
  } # managed by Certbot

  server_name servidor.nomeubairro.app;
  listen 80;
  return 404; # managed by Certbot
}
```

## PM2 for production mode

After Nginx configuration is correctly configured and loaded, we use PM2 to start the server in production mode, using the file `pm2.json` located in this directory

```
npm install pm2@latest -g
pm2 start pm2.json
```
