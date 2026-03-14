---
title: 这是一条测试文章
date: 2026-03-14T11:25:00.000+08:00
---
Hexo 实用博文合集

---
title: Hexo 主题更换与基础配置
---

Welcome to Hexo theme customization! A proper theme can make your blog more distinctive and comfortable to read. Check the Hexo theme documentation for more official info. If you encounter theme compatibility issues, you can search for solutions in the Hexo GitHub Issues or the theme’s official repository.

Quick Start

Find and download themes

# 推荐从 Hexo 官方主题库下载（以 Next 主题为例）
$ git clone https://github.com/next-theme/hexo-theme-next themes/next

More info: Hexo Official Themes

Enable the theme

# 编辑 Hexo 根目录下的 _config.yml 文件
$ vim _config.yml
# 将 theme 字段改为下载的主题名称（如 next）
theme: next

More info: Enabling a Theme

Basic theme configuration

# 进入主题配置文件目录（以 Next 为例）
$ cd themes/next
# 编辑主题专属配置文件
$ vim _config.yml
# 可配置：导航栏、头像、签名、配色、评论功能等

More info: Next Theme Configuration

Preview the theme

# 启动本地服务器，查看主题效果
$ hexo clean && hexo server

More info: Hexo Server

---
title: Hexo 插件安装与常用插件推荐
---

Hexo plugins can extend your blog’s functionality, such as adding search, comment, or SEO features. Check the Hexo plugin library for more options. If you have questions about plugin usage, you can refer to the plugin’s README or ask for help in the Hexo community.

Quick Start

Install a plugin

# 以安装 hexo-generator-search 搜索插件为例
$ npm install hexo-generator-search --save

More info:Installing Plugins

Configure the plugin

# 编辑 Hexo 根目录下的 _config.yml 文件
$ vim _config.yml
# 添加插件相关配置（以 search 插件为例）
search:
  path: search.xml
  field: post
  content: true

More info: Configuring Plugins

Uninstall a plugin

# 卸载不需要的插件（以 hexo-generator-search 为例）
$ npm uninstall hexo-generator-search --save

More info: Uninstalling Plugins

Recommended plugins

# 1. 搜索插件：hexo-generator-search
# 2. 代码高亮插件：hexo-prism-plugin
# 3. 评论插件：hexo-disqus
# 4. SEO 优化插件：hexo-seo
# 5. 图片床插件：hexo-imgur

More info: Hexo Plugin Library

---
title: Hexo 文章管理与格式优化
---

Proper article management and format optimization can make your blog more organized and readable. Check the Hexo writing documentation for more details. If you need to batch manage articles or adjust formats, you can use Hexo’s built-in commands or third-party tools.

Quick Start

Create a categorized post

# 创建带有分类和标签的文章
$ hexo new "Hexo Article Management"
# 编辑文章头部 Front-matter
---
title: Hexo Article Management
date: 2024-05-20 14:30:00
categories:
  - Hexo
tags:
  - Hexo
  - Blog
---

More info:Front-matter

Edit and update articles

# 直接编辑 source/_posts 目录下的 markdown 文件
$ vim source/_posts/Hexo-Article-Management.md
# 编辑完成后，重新生成并预览
$ hexo clean && hexo generate && hexo server

More info: Editing Posts

Delete an article

# 删除指定文章（直接删除对应 markdown 文件）
$ rm source/_posts/Hexo-Article-Management.md
# 清理缓存并重新生成
$ hexo clean && hexo generate

More info: Deleting Posts

Format optimization tips

# 1. 图片插入格式（推荐使用相对路径）
![图片描述](img/xxx.jpg)
# 2. 代码块格式（指定语言，实现高亮）
```bash
hexo server
```
# 3. 引用格式
> 这是一段引用文本
# 4. 目录生成（在文章头部添加）
[TOC]

More info: Markdown Syntax

---
title: Hexo 部署到 GitHub Pages 详细教程
---

Deploying Hexo to GitHub Pages is a common way to make your blog public for free. Check theHexo deployment documentation for more official guidance. If you encounter deployment failures, you can check your GitHub repository settings or the deployment log.

Quick Start

Prepare GitHub repository

# 1. 在 GitHub 上创建新仓库，仓库名格式：username.github.io
# 2. 复制仓库 SSH 地址（如 git@github.com:username/username.github.io.git）

More info: GitHub Pages Official Guide

Configure deployment settings

# 编辑 Hexo 根目录下的 _config.yml 文件
$ vim _config.yml
# 找到 deploy 字段，配置如下
deploy:
  type: git
  repo: git@github.com:username/username.github.io.git
  branch: main

More info: Git Deployment

Install deployment plugin

# 安装 hexo-deployer-git 插件
$ npm install hexo-deployer-git --save

More info: hexo-deployer-git

Deploy to GitHub Pages

# 生成静态文件并部署
$ hexo clean && hexo generate && hexo deploy
# 输入 GitHub 账号密码或 SSH 密钥密码（若配置 SSH）

More info: One-Command Deployment
