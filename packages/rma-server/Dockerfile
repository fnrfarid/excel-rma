FROM node:latest
# Copy app
COPY . /home/craft/rma-server
WORKDIR /home/craft/
RUN cd rma-server \
    && npm install \
    && npm run build \
    && rm -fr node_modules \
    && npm install --only=production

FROM node:slim

# Install packages
RUN apt-get update && apt-get install -y gettext-base && apt-get clean

# Setup docker-entrypoint
COPY docker/docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh

# Add non root user
RUN useradd -ms /bin/bash craft
WORKDIR /home/craft/rma-server
COPY --from=0 /home/craft/rma-server .

RUN chown -R craft:craft /home/craft

# set project directory
WORKDIR /home/craft/rma-server

# Expose port
EXPOSE 8800

ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["start"]
