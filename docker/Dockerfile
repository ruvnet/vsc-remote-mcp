FROM debian:bullseye-slim

# Avoid prompts from apt
ENV DEBIAN_FRONTEND=noninteractive

# Install dependencies
RUN apt-get update && apt-get install -y \
    curl \
    wget \
    git \
    nodejs \
    npm \
    openssh-client \
    sudo \
    locales \
    python3 \
    python3-pip \
    dumb-init \
    --no-install-recommends \
    && rm -rf /var/lib/apt/lists/*

# Set up locale
RUN sed -i -e 's/# en_US.UTF-8 UTF-8/en_US.UTF-8 UTF-8/' /etc/locale.gen && \
    dpkg-reconfigure --frontend=noninteractive locales && \
    update-locale LANG=en_US.UTF-8

ENV LANG=en_US.UTF-8

# Create a non-root user
RUN groupadd --gid 1000 coder \
    && useradd --uid 1000 --gid coder --shell /bin/bash --create-home coder \
    && echo "coder ALL=(ALL) NOPASSWD:ALL" > /etc/sudoers.d/coder \
    && chmod 0440 /etc/sudoers.d/coder

# Switch to user
USER coder
WORKDIR /home/coder

# Install code-server (VS Code in browser)
RUN curl -fsSL https://code-server.dev/install.sh | sh

# Create workspace directory
RUN mkdir -p /home/coder/workspace

# Install Roo extension
RUN code-server --install-extension rooveterinaryinc.roo-cline

# Expose the default code-server port
EXPOSE 8080

# Copy the entrypoint script
COPY --chown=coder:coder entrypoint.sh /home/coder/entrypoint.sh
RUN sudo chmod +x /home/coder/entrypoint.sh

# Start the server
ENTRYPOINT ["/usr/bin/dumb-init", "--"]
CMD ["/home/coder/entrypoint.sh"]