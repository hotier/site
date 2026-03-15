# Sveltia CMS 认证配置检查清单

## GitHub OAuth App 配置

1. 访问 https://github.com/settings/developers
2. 找到你的 OAuth App
3. 确保以下设置正确：

### Authorization callback URL
```
https://hotier.cc.cd/auth
```

### Homepage URL
```
https://hotier.cc.cd
```

## Vercel 环境变量

确保以下环境变量已设置：

- `GITHUB_CLIENT_ID` - 你的 GitHub OAuth App 的 Client ID
- `GITHUB_CLIENT_SECRET` - 你的 GitHub OAuth App 的 Client Secret
- `ALLOWED_DOMAINS` (可选) - 允许的域名，例如: `hotier.cc.cd,www.hotier.cc.cd`

## 文件修改总结

本次修复对以下文件进行了修改：

### 1. source/admin/config.yml
- 将 `base_url` 从 `https://hotier.cc.cd/api` 改为 `https://hotier.cc.cd`
- Sveltia CMS 会自动在 base_url 后添加 `/auth`

### 2. vercel.json
- 添加了路由规则，将 `/auth` 重定向到 `/api/auth`
- 这样 Sveltia CMS 请求的 `/auth` 会被正确路由到 auth.js 处理

### 3. api/auth.js
- 修复了 postMessage 的 targetOrigin，从 `'*'` 改为具体的域名
- 添加了 `window.opener` 存在性检查
- 添加了延迟关闭窗口，确保消息已发送
- 改进了 CORS 头设置，默认允许 `hotier.cc.cd` 域名
- 将 `redirectUri` 从 `/api/auth` 改为 `/auth`，与 vercel.json 路由保持一致

## 部署步骤

1. 确保 GitHub OAuth App 的 callback URL 设置为 `https://hotier.cc.cd/auth`
2. 提交并推送所有更改到 GitHub
3. 等待 Vercel 自动部署
4. 清除浏览器缓存（Ctrl+Shift+R 或 Cmd+Shift+R）
5. 访问 `https://hotier.cc.cd/admin/` 测试登录

## 故障排除

如果仍然出现 `AbortError Authentication aborted` 错误：

1. **检查浏览器控制台** - 查看是否有 CORS 错误或 postMessage 错误
2. **检查网络请求** - 查看 `/auth` 请求是否返回 200
3. **检查弹出窗口** - 确保弹出窗口没有被浏览器阻止
4. **尝试无痕模式** - 排除浏览器扩展干扰
5. **检查 Cloudflare 设置** - 如果使用了 Cloudflare，确保没有启用会干扰 JavaScript 的功能
