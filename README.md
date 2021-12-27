# vscode-cnb

博客园vscode插件, 主要功能是将本地markdown文件对应到博文园中博文, 从而让vscode用户可以一键发布markdown博文到博客园.

## 其他功能

### 登录/授权

使用本插件发布博文前, 需要用户使用浏览器进行授权操作.

## 博客园博文列表

当点击列表中的博文时, 会自动将博文内容下载到一个本地文件中, 之后便可以对本地文件进行编辑, 再次保存到博客园等操作

![img](https://img2020.cnblogs.com/blog/3/202112/3-20211227184342642-1938639868.png)


### 图片上传

当vscode处于配置好的`vscode-cnb`工作空间时, 可以通过快捷键, 上下文菜单, 编辑器工具栏等方式上传本地或剪贴板中的图片到博客园

![demo-upload-clipboard-image](https://img2020.cnblogs.com/blog/3/202112/3-20211223133219376-311354679.gif)

## vscode版本要求

>=1.62.0

## 插件设置

* `vscode-cnb.workspace`: `vscode-cnb`需要用到的一个工作空间, `vscode-cnb`只有检测到vscode处于此目录下才会生效, 默认会使用`~/Documents/Cnblogs`最为工作空间

![img](https://img2020.cnblogs.com/blog/3/202112/3-20211227183958436-462553661.png)
