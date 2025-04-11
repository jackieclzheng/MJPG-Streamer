package com.security.system.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ResourceHandlerRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        // 设置页面映射
        registry.addViewController("/").setViewName("forward:/index.html");
        registry.addViewController("/login").setViewName("forward:/login.html");
        registry.addViewController("/monitor").setViewName("forward:/monitor.html");
        registry.addViewController("/playback").setViewName("forward:/playback.html");
        registry.addViewController("/device").setViewName("forward:/device-management.html");
        registry.addViewController("/alarm").setViewName("forward:/alarm-management.html");
        registry.addViewController("/settings").setViewName("forward:/settings.html");
    }

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        // 设置静态资源映射
        registry.addResourceHandler("/**")
                .addResourceLocations("classpath:/static/");
                
        // 设置录像文件访问路径
        registry.addResourceHandler("/recordings/**")
                .addResourceLocations("file:/data/recordings/");
    }
}
