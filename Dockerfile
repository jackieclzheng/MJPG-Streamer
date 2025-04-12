FROM ubuntu:20.04

# 设置环境变量避免交互式配置
ENV DEBIAN_FRONTEND=noninteractive
ENV TZ=Asia/Shanghai

# 安装必要的构建工具和依赖
RUN apt-get update && apt-get install -y \
    cmake \
    build-essential \
    libjpeg-dev \
    git \
    ffmpeg \
    v4l-utils \
    && rm -rf /var/lib/apt/lists/*

# 克隆 MJPG-Streamer 代码
WORKDIR /opt
RUN git clone https://github.com/jacksonliam/mjpg-streamer.git

# 编译 MJPG-Streamer
WORKDIR /opt/mjpg-streamer/mjpg-streamer-experimental
RUN make && make install

# 创建配置目录
RUN mkdir -p /etc/mjpg-streamer

# 复制 www 文件
RUN cp -r www /usr/local/share/mjpg-streamer/

# 设置工作目录
WORKDIR /opt/mjpg-streamer/mjpg-streamer-experimental

# 暴露默认端口
EXPOSE 8080

# 创建启动脚本
RUN echo '#!/bin/bash\n\
export LD_LIBRARY_PATH=/opt/mjpg-streamer/mjpg-streamer-experimental\n\
./mjpg_streamer -i "input_uvc.so -d /dev/video0 -r 1280x720 -f 30" -o "output_http.so -w /usr/local/share/mjpg-streamer/www -p 8080"\n\
' > /usr/local/bin/start-stream.sh \
    && chmod +x /usr/local/bin/start-stream.sh

# 设置默认命令
CMD ["/usr/local/bin/start-stream.sh"]