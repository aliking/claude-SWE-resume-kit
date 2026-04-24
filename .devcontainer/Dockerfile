FROM mcr.microsoft.com/devcontainers/base:bookworm

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
    && apt-get install -y --no-install-recommends \
        ca-certificates \
        fonts-crosextra-carlito \
        git \
        jq \
        nodejs \
        npm \
        poppler-utils \
        python3 \
        ripgrep \
        texlive-fonts-extra \
        texlive-fonts-recommended \
        texlive-latex-base \
        texlive-latex-extra \
        texlive-latex-recommended \
        texlive-pictures \
        texlive-science \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

RUN mkdir -p /home/vscode/.claude \
    && chown -R vscode:vscode /home/vscode/.claude
