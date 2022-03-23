**目录**

- [简介](#简介)
- [主要功能](#主要功能)
  - [登录/授权](#登录授权)
  - [将本地markdown文件发布到博客园](#将本地markdown文件发布到博客园)
  - [博客园博文列表](#博客园博文列表)
  - [将本地文件关联到博客园博文](#将本地文件关联到博客园博文)
  - [图片上传](#图片上传)
  - [博文分类管理](#博文分类管理)
  - [导出pdf](#导出pdf)
- [vscode版本要求](#vscode版本要求)
- [插件设置](#插件设置)

## 简介

博客园vscode插件, 主要功能是将本地markdown文件对应到博文园中博文, 从而让vscode用户可以一键发布markdown博文到博客园.

## 主要功能

### 登录/授权

要使用本插件发布/修改博文, 需要先进行登录或授权操作.

![](https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228125556260-986735114.png)

### 将本地markdown文件发布到博客园

![](https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130156308-187058889.png)

![](https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130228248-172977703.png)

若本地文件已经关联到一篇博客园博文, 那么会直接更新这篇博文.

也通过vscode的`Command Palette`(唤起`Command Palette`快捷键, windows:`ctrl+shift+p`, macos: `command+shift+p`)调用`Cnblogs: 保存到博客园`命令, 将当前正在编辑的markdown文件保存到博客园上

![image](https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323151757542-155709896.png)

### 博客园博文列表

当点击列表中的博文时, 会自动将博文内容下载到工作空间一个本地文件中(此时这个本地文件就关联到了这篇博文), 完成编辑后可以再将本地的内容保存到博客园博文

![img](https://img2020.cnblogs.com/blog/3/202112/3-20211227184342642-1938639868.png)

### 将本地文件关联到博客园博文

一个本地文件可以关联到一篇博客园博文, 本地文件必须在`vscode-cnb.workspace`配置的工作目录中

![](https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130049842-409512486.png)

### 图片上传

当vscode处于配置好的`vscode-cnb`工作空间时, 可以通过快捷键, 上下文菜单, 编辑器工具栏等方式上传本地或剪贴板中的图片到博客园

![demo-upload-clipboard-image](https://img2020.cnblogs.com/blog/3/202112/3-20211223133219376-311354679.gif)

### 博文分类管理

支持新建, 删除(可批量操作), 修改博客园博文分类

![](https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130552877-1788018336.png)

### 导出pdf

支持将博文导出为pdf格式的文件到本地, 此功能依赖于[Chromium](https://www.chromium.org/chromium-projects/), vscode-cnb默认会先从本地寻找是否有已安装的Chrome或基于Chromium的Edge浏览器, 若有的话则会直接使用本地的Chrome或基于Chromium的Edge; 若未找到, 那么会提示用户手动选择本地的Chromium或其他基于Chromium的浏览器

![image](https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323135717910-1090211493.png)

也可以在vscode的设置中手动配置**Chromium或其他基于Chromium的浏览器的可执行文件路径**, 这个路径针对windows和macos是不同的两个配置, 可以根据自己使用的系统进行配置

![image](https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323135918858-1619509502.png)

支持多选

![image](https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323140426961-1518402131.png)

## vscode版本要求

\>=1.62.0

## 插件设置

* `workspace`: `vscode-cnb`需要用到的一个工作空间, `vscode-cnb`只有检测到vscode处于此目录下才会生效, 默认会使用`~/Documents/Cnblogs`作为工作空间

![img](https://img2020.cnblogs.com/blog/3/202112/3-20211227183958436-462553661.png)
