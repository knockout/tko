# Use an official Node.js image as the base image
FROM node:22-bookworm

# Install necessary dependencies for make and chromium
RUN apt-get update && apt-get install -y \
  build-essential \
  wget \
  gnupg \
  libx11-xcb1 \
  libxcomposite1 \
  libxcursor1 \
  libxdamage1 \
  libxi6 \
  libxtst6 \
  libnss3 \
  libxrandr2 \
  libasound2 \
  libpangocairo-1.0-0 \
  libatk-bridge2.0-0 \
  libgtk-3-0 \
  libgbm1 \
  xdg-utils \
  fonts-liberation \
  chromium \
  && rm -rf /var/lib/apt/lists/*

# Set the working directory
WORKDIR /usr/src/app

# Copy package.json and package-lock.json (or yarn.lock)
COPY package*.json ./

# Install dependencies using npm or yarn
#RUN npm install --force
#RUN yarn && yarn install

ENV CHROME_BIN=/usr/bin/chromium
ENV CHROME_PATH=/usr/bin/chromium

# Copy the rest of the application source code
COPY . .

# Set the default command to build the project using make
#CMD ["make"]

CMD ["sh", "-c", "sleep infinity"]

# Expose the build directory as a volume
VOLUME ["/usr/src/app/builds/knockout/dist"]
