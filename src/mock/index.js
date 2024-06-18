import Mock from 'mockjs';

// Mock 数据模板
const data = Mock.mock({
    'list|1-10': [
        {
            "id": 9,
            "title": "for in 对象ts报错",
            "subTitle": "ts报错",
            "tags": ",bug,",
            "cover": {
                "id": 5,
                "path": "https://static.lnow.site/6055f24a697a5aa0d8fdc487a4b5c28017b2c996",
                "thumb": "https://static.lnow.site/6055f24a697a5aa0d8fdc487a4b5c28017b2c996/thumb",
                "hash": "6055f24a697a5aa0d8fdc487a4b5c28017b2c996",
                "width": 67,
                "height": 48,
                "size": 1173,
                "color": "#f2f2f2",
                "from": 1,
                "createDate": "2024/06/13 14:12:42"
            },
            "intro": "for in 对象ts报错",
            "pubDate": "2024/06/14 11:42:32",
            "status": 1,
            "createDate": "2024/06/14 11:42:32"
        },
        {
            "id": 8,
            "title": "测试",
            "subTitle": "测试",
            "tags": ",测试,",
            "cover": {
                "id": 8,
                "path": "https://static.lnow.site/cdbb4851edbee3eaf7d4a16bae925f0dca13cfa0",
                "thumb": "https://static.lnow.site/cdbb4851edbee3eaf7d4a16bae925f0dca13cfa0/thumb",
                "hash": "cdbb4851edbee3eaf7d4a16bae925f0dca13cfa0",
                "width": 584,
                "height": 878,
                "size": 74174,
                "color": "#8a8171",
                "from": 1,
                "createDate": "2024/06/13 15:01:30"
            },
            "intro": "测试",
            "pubDate": "2024/06/13 15:01:35",
            "status": 1,
            "createDate": "2024/06/13 15:01:35"
        },
        {
            "id": 7,
            "title": "tesst",
            "subTitle": "tesst",
            "tags": ",tesst,",
            "cover": {
                "id": 7,
                "path": "https://static.lnow.site/4bc32bdc43a18d38046fff1cf85581c294f8751f",
                "thumb": "https://static.lnow.site/4bc32bdc43a18d38046fff1cf85581c294f8751f/thumb",
                "hash": "4bc32bdc43a18d38046fff1cf85581c294f8751f",
                "width": 1920,
                "height": 1200,
                "size": 663093,
                "color": "#6d6c69",
                "from": 1,
                "createDate": "2024/06/13 15:00:53"
            },
            "intro": "tesst",
            "pubDate": "2024-06-13T07:00:52.700Z",
            "status": 0,
            "createDate": "2024/06/13 15:00:55"
        },
        {
            "id": 6,
            "title": "vue3+ts 问题汇总",
            "subTitle": "问题汇总",
            "tags": ",vue3,ts,bug,",
            "cover": null,
            "intro": "vue3+ts 遇到的问题汇总和解决办法",
            "pubDate": "2024/06/13 11:40:34",
            "status": 1,
            "createDate": "2024/06/13 11:40:34"
        },
        {
            "id": 4,
            "title": "vue3-项目搭建",
            "subTitle": "vue3-项目搭建",
            "tags": ",vue3,ts,element,axios,prettierrc,",
            "cover": {
                "id": 6,
                "path": "https://static.lnow.site/9b532ef8f23fe3284988c9c523f39f41bb796109",
                "thumb": "https://static.lnow.site/9b532ef8f23fe3284988c9c523f39f41bb796109/thumb",
                "hash": "9b532ef8f23fe3284988c9c523f39f41bb796109",
                "width": 1920,
                "height": 1200,
                "size": 672672,
                "color": "#abb8c7",
                "from": 1,
                "createDate": "2024/06/13 14:29:07"
            },
            "intro": "vue3-项目搭建，vue3 + ts + element + axios + prettierrc",
            "pubDate": "2024-06-12T07:55:37.500Z",
            "status": 0,
            "createDate": "2024/06/12 16:20:57"
        }
    ]
});

// 模拟 mock 接口
Mock.mock('https://mock.lnow.site/article/v1/list', 'get', {
    status: 200,
    message: 'success',
    data: {
        list: data.list,
        total: data.list.length
    }
});

export default Mock;
