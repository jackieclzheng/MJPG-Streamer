#!/bin/bash

MYSQL_USER="root"
MYSQL_PASSWORD="Test@123456"
DB_NAME="mstreamer"

echo "开始初始化数据库..."

# 检查 MySQL 服务状态
if ! mysql.server status > /dev/null 2>&1; then
    echo "Starting MySQL server..."
    mysql.server start
fi

# 执行 SQL 脚本
mysql -u$MYSQL_USER -p$MYSQL_PASSWORD < ../src/main/resources/db/init.sql

if [ $? -eq 0 ]; then
    echo "数据库初始化成功！"
    echo "默认管理员账号："
    echo "用户名：admin"
    echo "密码：admin123"
else
    echo "数据库初始化失败！"
    exit 1
fi