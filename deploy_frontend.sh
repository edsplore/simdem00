#!/bin/bash

# Frontend Deployment Script
# Usage: ./deploy_frontend.sh

set -e  # Exit on any error

# Configuration
APP_DIR="/home/azureuser/EverAI%20Simulator%20Frontend"
DIST_DIR="$APP_DIR/dist"
LOG_FILE="$APP_DIR/frontend_deploy.log"
BACKUP_DIR="$APP_DIR/dist_backup"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}🌐 Starting Frontend Deployment...${NC}"

# Function to check if npm is available
check_npm() {
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm is not installed or not in PATH${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ npm is available${NC}"
}

# Function to check if SWA CLI is available
check_swa() {
    if ! command -v swa &> /dev/null; then
        echo -e "${YELLOW}⚠️  SWA CLI not found. Installing globally...${NC}"
        npm install -g @azure/static-web-apps-cli
        if ! command -v swa &> /dev/null; then
            echo -e "${RED}❌ Failed to install SWA CLI${NC}"
            exit 1
        fi
    fi
    echo -e "${GREEN}✅ SWA CLI is available${NC}"
}

# Function to backup existing dist folder
backup_dist() {
    if [ -d "$DIST_DIR" ]; then
        echo -e "${YELLOW}📦 Backing up existing dist folder...${NC}"
        rm -rf "$BACKUP_DIR"
        cp -r "$DIST_DIR" "$BACKUP_DIR"
        echo -e "${GREEN}✅ Backup created at $BACKUP_DIR${NC}"
    else
        echo -e "${BLUE}ℹ️  No existing dist folder to backup${NC}"
    fi
}

# Function to install dependencies
install_dependencies() {
    echo -e "${BLUE}📦 Installing/updating dependencies...${NC}"
    npm install
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
    else
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        exit 1
    fi
}

# Function to build the application
build_application() {
    echo -e "${BLUE}🔨 Building the application...${NC}"
    
    # Clear previous dist folder
    if [ -d "$DIST_DIR" ]; then
        rm -rf "$DIST_DIR"
    fi
    
    # Run the build command and capture output
    npm run build 2>&1 | tee "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✅ Build completed successfully${NC}"
        
        # Check if dist folder was created
        if [ -d "$DIST_DIR" ]; then
            echo -e "${GREEN}✅ Dist folder created successfully${NC}"
            
            # Show build statistics
            echo -e "${BLUE}📊 Build Statistics:${NC}"
            echo "📁 Dist folder size: $(du -sh "$DIST_DIR" | cut -f1)"
            echo "📄 Number of files: $(find "$DIST_DIR" -type f | wc -l)"
        else
            echo -e "${RED}❌ Dist folder not found after build${NC}"
            exit 1
        fi
    else
        echo -e "${RED}❌ Build failed${NC}"
        echo -e "${YELLOW}📄 Build log:${NC}"
        cat "$LOG_FILE"
        exit 1
    fi
}

# Function to deploy to Azure Static Web Apps
deploy_to_swa() {
    echo -e "${BLUE}🚀 Deploying to Azure Static Web Apps...${NC}"
    
    # Run SWA deploy command and capture output
    swa deploy dist/ --env production 2>&1 | tee -a "$LOG_FILE"
    
    if [ ${PIPESTATUS[0]} -eq 0 ]; then
        echo -e "${GREEN}✅ Deployment to SWA completed successfully${NC}"
    else
        echo -e "${RED}❌ SWA deployment failed${NC}"
        echo -e "${YELLOW}📄 Checking deployment log...${NC}"
        tail -n 20 "$LOG_FILE"
        
        # Offer to restore backup
        if [ -d "$BACKUP_DIR" ]; then
            echo -e "${YELLOW}💡 Backup available. To restore: cp -r $BACKUP_DIR $DIST_DIR${NC}"
        fi
        exit 1
    fi
}

# Function to copy to local web server (optional)
deploy_to_local() {
    local web_root="/var/www/html"
    
    if [ -d "$web_root" ]; then
        echo -e "${BLUE}📂 Copying to local web server...${NC}"
        sudo cp -R "$DIST_DIR"/* "$web_root/"
        sudo chown -R www-data:www-data "$web_root"
        sudo chmod -R 755 "$web_root"
        echo -e "${GREEN}✅ Files copied to local web server${NC}"
    else
        echo -e "${YELLOW}⚠️  Local web server directory not found, skipping local deployment${NC}"
    fi
}

# Function to run post-deployment checks
post_deployment_checks() {
    echo -e "${BLUE}🔍 Running post-deployment checks...${NC}"
    
    # Check if key files exist in dist
    local key_files=("index.html")
    for file in "${key_files[@]}"; do
        if [ -f "$DIST_DIR/$file" ]; then
            echo -e "${GREEN}✅ $file found${NC}"
        else
            echo -e "${YELLOW}⚠️  $file not found${NC}"
        fi
    done
    
    # Show deployment summary
    echo -e "${BLUE}📊 Deployment Summary:${NC}"
    echo "🕒 Deployment time: $(date)"
    echo "📁 Build output: $DIST_DIR"
    echo "📄 Deployment log: $LOG_FILE"
    echo "💾 Backup location: $BACKUP_DIR"
}

# Function to show helpful commands
show_helpful_commands() {
    echo -e "${YELLOW}💡 Helpful Commands:${NC}"
    echo "📄 View full deployment log: cat $LOG_FILE"
    echo "🌐 Check SWA status: swa --version"
    echo "🔄 Restore backup: cp -r $BACKUP_DIR $DIST_DIR"
    echo "🧹 Clean node_modules: rm -rf node_modules && npm install"
    echo "🏠 Local development: npm run dev"
}

# Main deployment process
main() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   Frontend Deployment Script   ${NC}"
    echo -e "${BLUE}================================${NC}"
    echo
    
    # Change to application directory
    echo -e "${BLUE}📁 Changing to application directory: $APP_DIR${NC}"
    cd "$APP_DIR"
    echo
    
    # Step 1: Pre-flight checks
    echo -e "${BLUE}Step 1: Pre-flight checks${NC}"
    check_npm
    check_swa
    echo
    
    # Step 2: Backup existing build
    echo -e "${BLUE}Step 2: Backup existing build${NC}"
    backup_dist
    echo
    
    # Step 3: Install dependencies
    echo -e "${BLUE}Step 3: Installing dependencies${NC}"
    install_dependencies
    echo
    
    # Step 4: Build application
    echo -e "${BLUE}Step 4: Building application${NC}"
    build_application
    echo
    
    # Step 5: Deploy to Azure SWA
    echo -e "${BLUE}Step 5: Deploying to Azure Static Web Apps${NC}"
    deploy_to_swa
    echo
    
    # Step 6: Post-deployment checks
    echo -e "${BLUE}Step 7: Post-deployment checks${NC}"
    post_deployment_checks
    echo
    
    # Step 7: Show helpful commands
    show_helpful_commands
    echo
    
    echo -e "${GREEN}🎉 Frontend deployment completed successfully!${NC}"
    echo -e "${BLUE}🌐 Your application should be available on your Azure Static Web App URL${NC}"
}

# Handle script interruption
trap 'echo -e "\n${RED}⚠️  Deployment interrupted${NC}"; exit 1' INT

# Run the main function
main
