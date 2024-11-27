# workers

cloudflare worker提供一个无服务器的linux执行环境，允许创建新的应用或增强现有应用，不需要配置或维护基础设施（服务器）。

### 1.1、功能

1、使用[wrangler](https://developers.cloudflare.com/workers/wrangler/)

2、可以绑定cloudflare上的资源、包括 R2、KV、D1、Objects、Durable

3、[playground](https://developers.cloudflare.com/workers/playground/) 提供了一种在浏览器上即时的方法来预览和测试的沙箱。

1.2 、产品介绍

**[Workers AI](https://developers.cloudflare.com/workers-ai/)**

Run machine learning models, powered by serverless GPUs, on Cloudflare’s global network.

在Cloudflare的全球网络上运行由无服务器GPU提供支持的机器学习模型。在Cloudflare的全球网络上运行由无服务器GPU提供支持的机器学习模型。

**[R2](https://developers.cloudflare.com/r2/)**

Store large amounts of unstructured data without the costly egress bandwidth fees associated with typical cloud storage services.

存储大量非结构化数据，无需支付与典型云存储服务相关的昂贵出口带宽费用。 存储大量非结构化数据，无需支付与与典型云存储相关的昂贵宽带费用（可以用来保存 图片）

**[D1](https://developers.cloudflare.com/d1/)**

Create new serverless SQL databases to query from your Workers and Pages projects.

创建新的无服务器SQL数据库以从Workers和Pages项目中查询。（可以作为数据库存储）

**[Durable Objects](https://developers.cloudflare.com/durable-objects/)**

A globally distributed coordination API with strongly consistent storage.

具有高度一致存储的全球分布式协调API。

**[KV](https://developers.cloudflare.com/kv/)**

Create a global, low-latency, key-value data storage.

创建全局、低延迟、键值数据存储。（键值对存储，小数据量）

**[Queues](https://developers.cloudflare.com/queues/)**

Send and receive messages with guaranteed delivery and no charges for egress bandwidth.

发送和接收消息，保证传递，不收取出口带宽费用。

**[Hyperdrive](https://developers.cloudflare.com/hyperdrive/)**

Turn your existing regional database into a globally distributed database.

将现有的区域数据库转变为全球分布式数据库。

**[Vectorize](https://developers.cloudflare.com/vectorize/)**

Build full-stack AI applications with Vectorize, Cloudflare’s vector database.

使用Cloudflare的矢量数据库Vectorize构建全栈AI应用程序。

**[Zaraz](https://developers.cloudflare.com/zaraz/)**

Offload third-party tools and services to the cloud and improve the speed and security of your website.

将第三方工具和服务卸载到云端，提高网站的速度和安全性。
