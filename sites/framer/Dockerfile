# IMPORTANT: Build this from your monorepo ROOT.

# Stage 1: Build the VitePress site within the Rush Monorepo context
FROM node:20-alpine AS builder

# Install Git and update apk cache.
RUN apk update && apk add --no-cache git bash # Add bash for more robust shell execution

# Install Rush globally and pnpm.
RUN npm install -g @microsoft/rush@5.153.2
RUN npm install -g pnpm@9.12.2

# Set the working directory to mimic the monorepo root.
WORKDIR /usr/src/monorepo

# Clone the repository directly into the WORKDIR.
ARG REPO_URL="https://github.com/smolinari/framer"
ARG REPO_BRANCH="main"
RUN git clone --branch ${REPO_BRANCH} ${REPO_URL} .

# Explicitly create the common/temp directory just in case
RUN mkdir -p common/temp

# Perform the Rush installation using BuildKit cache mounts.
# We're reverting to 'rush install' without --purge here, as --purge could sometimes interact oddly.
# The cache target for pnpm-store is crucial.
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/src/monorepo/common/temp/pnpm-store \
    rush install

# Build the VitePress site using Rush's build system.
RUN CI=true rush build -o framer-site

# Stage 2: Serve the static files with Node.js's http-server
FROM node:20-alpine

# Install http-server globally.
RUN npm install -g http-server

# Set the working directory for the web server.
WORKDIR /usr/share/web-app

# Copy the built static files from the 'builder' stage.
COPY --from=builder /usr/src/monorepo/sites/framer/.vitepress/dist ./

# Expose the port that http-server will listen on.
EXPOSE 8080

# Define the command to run when the container starts.
CMD ["http-server", "-p", "8080", "."]