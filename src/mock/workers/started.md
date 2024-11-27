# Cli

Set up and deploy your first Worker with Wrangler, the Cloudflare Developer Platform CLI.

使用Wrangler（Cloudflare Developer Platform CLI）设置和部署您的第一个Worker。

条件：

1、注册一个[Cloudflare帐户](https://dash.cloudflare.com/sign-up/workers-and-pages)。

2、安装[`Node.js`插件](https://docs.npmjs.com/downloading-and-installing-node-js-and-npm)。（注：需要Node`16.17.0`或更高版本）

### 一、创建一个新的Worker项目

打开一个终端窗口并运行C3来创建您的Worker项目。[C3（`Cloudflare-Cloud`）](https://github.com/cloudflare/workers-sdk/tree/main/packages/create-cloudflare)是一个命令行工具，旨在帮助您设置和部署新应用程序到Cloudflare。

```
npm create cloudflare@latest -- my-first-worker
```

对于设置，请选择以下选项：

- For _What would you like to start with?_, choose `Hello World example`.你想先来点什么？，选择Hello World示例。
- For _Which template would you like to use?_, choose `Hello World Worker`.您想使用哪个模板？选择Hello World Worker。
- For _Which language do you want to use?_, choose `JavaScript`.您想使用哪种语言？，选择JavaScript。
- For _Do you want to use git for version control?_, choose `Yes`.你想使用git进行版本控制吗？，选择是。
- For _Do you want to deploy your application?_, choose `No` (we will be making some changes before deploying).对于是否要部署应用程序？，选择否（我们将在部署之前进行一些更改）。

现在，您有一个新的项目设置。移到项目文件夹中。

```
cd my-first-worker
```
