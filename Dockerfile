FROM node:10.15.0-slim@sha256:bb4a5a0bdc9886b180d52b556b1e3f3f624bc8c13d50bd3edca1dbeb7aa7ac0b

RUN  apt-get update \
     # See https://crbug.com/795759
     && apt-get install -yq libgconf-2-4 \
     # Install latest chrome dev package, which installs the necessary libs to
     # make the bundled version of Chromium that Puppeteer installs work.
     && apt-get install -y wget --no-install-recommends \
     && wget -q -O - https://dl-ssl.google.com/linux/linux_signing_key.pub | apt-key add - \
     && sh -c 'echo "deb [arch=amd64] http://dl.google.com/linux/chrome/deb/ stable main" >> /etc/apt/sources.list.d/google.list' \
     && apt-get update \
     && apt-get install -y google-chrome-unstable fonts-ipafont-gothic fonts-wqy-zenhei fonts-thai-tlwg fonts-kacst ttf-freefont --no-install-recommends \
     && rm -rf /var/lib/apt/lists/*

RUN apt-get update
RUN mkdir -p /usr/share/man/man1
RUN apt-get install -y openjdk-8-jdk-headless:amd64
RUN apt-get install -y git
#Debugging Tools
#RUN apt-get install -y net-tools
#RUN apt-get install -y iputils-ping
#RUN apt-get install -y mysql-client
#Show Java version
RUN javac -version
#Start composing application
WORKDIR /usr/src/app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building your code for production
# RUN npm install --only=production

# Bundle app source
COPY . .

RUN chown -R node:node tmp/
RUN chown -R node:node ncpdp_script_standard/
RUN chown -R node:node client_examples/
RUN chown -R node:node node_modules/xsd-schema-validator/
USER node
#RUN node_modules/.bin/md-to-pdf --config-file implementation-guide.json implementation-guide.md ~/implementation-guide.pdf
EXPOSE 1337
CMD [ "npm", "start" ]
