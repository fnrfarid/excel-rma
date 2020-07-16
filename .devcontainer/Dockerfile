FROM bitnami/node:latest

ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=$USER_UID

# Configure dependencies
ENV DEBIAN_FRONTEND=noninteractive
RUN install_packages apt-utils git procps sudo

# Add user, group, and add user to sudoer group
RUN groupadd --gid $USER_GID $USERNAME \
    && useradd --no-log-init -r -m -u $USER_UID -g $USER_GID -G sudo -s /bin/bash $USERNAME \
    && echo "${USERNAME} ALL=(ALL) NOPASSWD: ALL" >> /etc/sudoers

# Install dev tools
RUN npm i -g @nestjs/cli @angular/cli lerna

ENV DEBIAN_FRONTEND=dialog
EXPOSE 4700 8800

# Set the default shell to bash instead of sh
USER $USERNAME
ENV SHELL /bin/bash

CMD [ "sleep", "infinity" ]
