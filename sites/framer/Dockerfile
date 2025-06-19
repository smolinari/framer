# IMPORTANT: This Dockerfile should still be placed in your project directory (e.g., my-monorepo/sites/framer/Dockerfile)
# You will still build it from the monorepo ROOT:
# cd /path/to/your/my-monorepo
# docker build -f sites/framer/Dockerfile -t scottamolinari/framer-site:1.0.0 .

# Stage 1: Build the VitePress site within the Rush Monorepo context
FROM node:20-alpine AS builder

# Install Git and update apk cache. Git is essential for cloning and for Rush.
RUN apk update && apk add --no-cache git

# Install Rush globally. Pinning versions is good practice.
RUN npm install -g @microsoft/rush@5.153.2
# Install pnpm globally.
RUN npm install -g pnpm@9.12.2

# Define build arguments for cloning the repository.
# These allow you to specify the repo URL and branch/commit when building.
ARG REPO_URL="https://github.com/smolinari/framer"
ARG REPO_BRANCH="main" 

# --- IMPORTANT FOR PRIVATE REPOS ---
# If your GitHub repository is PRIVATE, you'll need authentication.
# The most secure way (BuildKit secrets):
# RUN --mount=type=secret,id=github_token \
#     git clone https://oauth2:$(cat /run/secrets/github_token)@github.com/your-org/your-monorepo.git /usr/src/monorepo
# Then build with: docker build --secret id=github_token,src=./.github_token_file ...

# For public repos, or if authentication is handled externally (e.g., CI environment):
# Clone the repository directly into the final monorepo WORKDIR.
# This makes /usr/src/monorepo the root of your cloned Git repo.
WORKDIR /usr/src/monorepo
RUN git clone --branch ${REPO_BRANCH} ${REPO_URL} .

# At this point, the entire monorepo, including the hidden .git folder, is present at /usr/src/monorepo.
# Rush will now correctly detect it as a Git repository and perform its analyses.

# Perform the Rush installation using BuildKit cache mounts.
# These mounts help prevent EXDEV errors and significantly speed up builds by caching node_modules.
RUN --mount=type=cache,target=/root/.npm \
    --mount=type=cache,target=/usr/src/monorepo/common/temp \
    rush update --full --purge

# Now, change the working directory to the specific project's folder you want to build.
WORKDIR /usr/src/monorepo/sites/framer

# Build the VitePress site using Rush's build system.
RUN rush build --to framer-site


# Stage 2: Serve the static files with Node.js's http-server
FROM node:20-alpine

# Install http-server globally.
RUN npm install -g http-server

# Set the working directory to where the built static files will be copied.
WORKDIR /usr/share/web-app

# Copy the built static files from the 'builder' stage.
# The path reflects the monorepo structure within the builder stage.
COPY --from=builder /usr/src/monorepo/sites/framer/.vitepress/dist ./

# Expose the port that http-server will listen on inside the container.
EXPOSE 8080

# Define the command to run when the container starts.
CMD ["http-server", "-p", "8080", "."]