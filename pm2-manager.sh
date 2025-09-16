#!/bin/bash

# PM2 Management Script for School Management System
# This script provides easy commands for managing your deployed application

case "$1" in
    "start")
        echo "🚀 Starting all applications..."
        pm2 start ecosystem.config.json
        pm2 save
        ;;
        
    "stop")
        echo "🛑 Stopping all applications..."
        pm2 stop all
        ;;
        
    "restart")
        echo "🔄 Restarting all applications..."
        pm2 restart all
        ;;
        
    "status")
        echo "📊 Application status:"
        pm2 status
        ;;
        
    "logs")
        if [ -z "$2" ]; then
            echo "📋 Showing logs for all applications:"
            pm2 logs
        else
            echo "📋 Showing logs for $2:"
            pm2 logs "$2"
        fi
        ;;
        
    "monitor")
        echo "📈 Opening PM2 monitor..."
        pm2 monit
        ;;
        
    "reload")
        echo "🔄 Reloading applications (zero-downtime)..."
        pm2 reload all
        ;;
        
    "delete")
        echo "🗑️  Deleting all applications..."
        pm2 delete all
        ;;
        
    "backend-only")
        case "$2" in
            "start")
                pm2 start ecosystem.config.json --only school-backend
                ;;
            "restart")
                pm2 restart school-backend
                ;;
            "stop")
                pm2 stop school-backend
                ;;
            "logs")
                pm2 logs school-backend
                ;;
            *)
                echo "Usage: $0 backend-only {start|restart|stop|logs}"
                ;;
        esac
        ;;
        
    "frontend-only")
        case "$2" in
            "start")
                pm2 start ecosystem.config.json --only school-frontend
                ;;
            "restart")
                pm2 restart school-frontend
                ;;
            "stop")
                pm2 stop school-frontend
                ;;
            "logs")
                pm2 logs school-frontend
                ;;
            *)
                echo "Usage: $0 frontend-only {start|restart|stop|logs}"
                ;;
        esac
        ;;
        
    "update")
        echo "🔄 Updating application from git..."
        git pull origin main
        
        echo "📦 Installing dependencies..."
        npm install
        
        cd shared-types
        npm install
        npm run build
        
        cd ../backend
        npm install
        npx prisma generate
        npm run build
        
        cd ../frontend
        npm install
        npm run build
        
        cd ..
        echo "🔄 Restarting applications..."
        pm2 restart all
        
        echo "✅ Update completed!"
        ;;
        
    "backup-db")
        echo "💾 Creating database backup..."
        BACKUP_FILE="/home/schoolapp/backups/db_backup_$(date +%Y%m%d_%H%M%S).sql"
        mkdir -p /home/schoolapp/backups
        pg_dump -h localhost -U schoolapp_user school_management_db > "$BACKUP_FILE"
        echo "✅ Database backup created: $BACKUP_FILE"
        ;;
        
    "restore-db")
        if [ -z "$2" ]; then
            echo "❌ Please provide backup file path"
            echo "Usage: $0 restore-db /path/to/backup.sql"
            exit 1
        fi
        
        echo "⚠️  Warning: This will replace the current database!"
        read -p "Are you sure? (y/N): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[Yy]$ ]]; then
            echo "🔄 Restoring database from $2..."
            psql -h localhost -U schoolapp_user school_management_db < "$2"
            echo "✅ Database restored!"
        fi
        ;;
        
    "health-check")
        echo "🏥 Running health check..."
        
        # Check if applications are running
        pm2 list | grep -q "online" && echo "✅ PM2 processes are running" || echo "❌ PM2 processes are down"
        
        # Check database connection
        pg_isready -h localhost -p 5432 && echo "✅ Database is accessible" || echo "❌ Database is not accessible"
        
        # Check nginx
        sudo systemctl is-active --quiet nginx && echo "✅ Nginx is running" || echo "❌ Nginx is not running"
        
        # Check disk space
        DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
        if [ "$DISK_USAGE" -lt 80 ]; then
            echo "✅ Disk usage is normal ($DISK_USAGE%)"
        else
            echo "⚠️  Disk usage is high ($DISK_USAGE%)"
        fi
        
        # Check memory usage
        MEM_USAGE=$(free | grep Mem | awk '{printf "%.0f", $3/$2 * 100.0}')
        if [ "$MEM_USAGE" -lt 80 ]; then
            echo "✅ Memory usage is normal ($MEM_USAGE%)"
        else
            echo "⚠️  Memory usage is high ($MEM_USAGE%)"
        fi
        ;;
        
    "setup-cron")
        echo "⏰ Setting up cron jobs..."
        
        # Create cron file
        cat > /tmp/school_cron << EOF
# School Management System Cron Jobs

# Database backup every day at 2 AM
0 2 * * * /home/schoolapp/schoolmanagementsystem/pm2-manager.sh backup-db

# Health check every 30 minutes
*/30 * * * * /home/schoolapp/schoolmanagementsystem/pm2-manager.sh health-check >> /home/schoolapp/logs/health-check.log 2>&1

# SSL certificate renewal (Let's Encrypt)
0 12 * * * /usr/bin/certbot renew --quiet

# Clean old log files (keep last 7 days)
0 3 * * * find /home/schoolapp/logs -name "*.log" -mtime +7 -delete
EOF
        
        # Install cron file
        crontab /tmp/school_cron
        rm /tmp/school_cron
        
        echo "✅ Cron jobs set up successfully!"
        echo "📋 Scheduled tasks:"
        echo "• Daily database backup at 2:00 AM"
        echo "• Health check every 30 minutes"
        echo "• SSL certificate renewal check daily"
        echo "• Log cleanup weekly"
        ;;
        
    *)
        echo "🎯 School Management System PM2 Manager"
        echo "========================================"
        echo ""
        echo "Usage: $0 {command} [options]"
        echo ""
        echo "Commands:"
        echo "  start           Start all applications"
        echo "  stop            Stop all applications"
        echo "  restart         Restart all applications"
        echo "  reload          Reload apps (zero-downtime)"
        echo "  status          Show application status"
        echo "  logs [app]      Show logs (all or specific app)"
        echo "  monitor         Open PM2 monitor dashboard"
        echo "  delete          Delete all applications"
        echo ""
        echo "  backend-only    {start|restart|stop|logs}"
        echo "  frontend-only   {start|restart|stop|logs}"
        echo ""
        echo "  update          Update from git and restart"
        echo "  backup-db       Create database backup"
        echo "  restore-db      Restore database from backup"
        echo "  health-check    Run system health check"
        echo "  setup-cron      Set up automated tasks"
        echo ""
        echo "Examples:"
        echo "  $0 start"
        echo "  $0 logs school-backend"
        echo "  $0 backend-only restart"
        echo "  $0 backup-db"
        ;;
esac