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
# Install mysql Dockerize
ENV DOCKERIZE_VERSION v0.6.1
RUN wget https://github.com/jwilder/dockerize/releases/download/$DOCKERIZE_VERSION/dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && tar -C /usr/local/bin -xzvf dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz \
    && rm dockerize-linux-amd64-$DOCKERIZE_VERSION.tar.gz

# Setup docker-entrypoint
COPY docker/docker-entrypoint.sh usr/local/bin/docker-entrypoint.sh
RUN ln -s usr/local/bin/docker-entrypoint.sh / # backwards compat

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
