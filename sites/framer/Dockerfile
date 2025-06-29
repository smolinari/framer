# Dockerfile for building and serving the VitePress site within a Rush Monorepo.
# To build this image:
#   1. Navigate to your monorepo root: cd /path/to/your/my-monorepo
#   2. Run the build command, providing your repo details:
#      docker build -f sites/framer/Dockerfile -t scottamolinari/framer-site:1.0.0 .
#
# To run the built container:
#   docker run -p 8080:8080 scottamolinari/framer-site:1.0.0


# Stage 1: Build the VitePress site
# Uses Node.js to manage Rush/PNPM and build the static site.
FROM node:20-alpine AS builder

# Install Git: Essential for cloning the monorepo and for Rush's internal operations.
RUN apk update && apk add --no-cache git

# Install Rush and pnpm globally.
# Rush will manage its specific pnpm version based on rush.json.
RUN npm install -g @microsoft/rush@5.153.2
RUN npm install -g pnpm@9.12.2

# Set the working directory to the container's monorepo root.
WORKDIR /usr/src/monorepo

# Clone the entire Git repository into the working directory.
# This ensures Rush finds the .git folder and all project files.
ARG REPO_URL="https://github.com/smolinari/framer"
ARG REPO_BRANCH="main"
RUN git clone --branch ${REPO_BRANCH} ${REPO_URL} .

# Copy the download artifacts from the local build context into the
# VitePress public directory so they can be included in the site build.
RUN mkdir -p sites/framer/public/downloads
COPY sites/framer/public/downloads/ sites/framer/public/downloads/

# Perform the Rush installation.
# This sets up node_modules across the monorepo.
# The cache mount helps prevent EXDEV errors and speeds up builds.

# Perform the Rush installation.
# This sets up node_modules across the monorepo.
# The cache mount helps prevent EXDEV errors and speeds up builds.
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/src/monorepo/common/temp/pnpm-store \
    rush install

# Change to the specific project directory for building.
WORKDIR /usr/src/monorepo/sites/framer

# Build the VitePress site using your custom Rush command.
# This command (e.g., 'rush build-framer-site') should be defined in your
# common/config/rush/command-line.json with 'warningsAsErrors: false'
# to ensure a successful exit code for Docker even with warnings.
RUN rush build-framer-site --to framer-site


# Stage 2: Serve the static files with http-server
# Uses a Node.js base for the http-server utility.
FROM node:20-alpine

# Install http-server globally.
RUN npm install -g http-server

# Set the working directory for the web server to the root of your static files.
WORKDIR /usr/share/web-app

# Copy the built static files from the 'builder' stage into this final image.
COPY --from=builder /usr/src/monorepo/sites/framer/.vitepress/dist ./

# Expose port 8080.
EXPOSE 8080

# Define the command to run when the container starts.
CMD ["http-server", "-p", "8080", "-a", "0.0.0.0", "."]