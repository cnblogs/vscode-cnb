[![Current Version](https://vsmarketplacebadge.apphb.com/version-short/cnblogs.vscode-cnb.svg)](https://marketplace.visualstudio.com/items?itemName=cnblogs.vscode-cnb&ssr=false#overview)
[![](https://vsmarketplacebadge.apphb.com/downloads-short/cnblogs.vscode-cnb.svg)](https://marketplace.visualstudio.com/items?itemName=cnblogs.vscode-cnb&ssr=false#overview)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/cnblogs/vscode-cnb/Build%20and%20check%20the%20code%20format/main)](https://github.com/cnblogs/vscode-cnb)
[![GitHub](https://img.shields.io/github/license/cnblogs/vscode-cnb)](https://github.com/cnblogs/vscode-cnb/blob/main/LICENSE.txt)
[![GitHub issues](https://img.shields.io/github/issues-raw/cnblogs/vscode-cnb)](https://github.com/cnblogs/vscode-cnb/issues)

**目录**

- [简介](#简介)
- [主要功能](#主要功能)
	- [登录 / 授权](#登录--授权)
	- [将本地 markdown 文件发布到博客园](#将本地-markdown-文件发布到博客园)
	- [博客园博文列表](#博客园博文列表)
	- [搜索博文](#搜索博文)
	- [将本地文件关联到博客园博文](#将本地文件关联到博客园博文)
	- [拉取远程博文内容更新本地文件](#拉取远程博文内容更新本地文件)
	- [图片上传](#图片上传)
	- [博文分类管理](#博文分类管理)
	- [导出 pdf](#导出-pdf)
	- [提取图片](#提取图片)
	- [博文设置面板](#博文设置面板)
	- [闪存](#闪存)
- [vscode 版本要求](#vscode-版本要求)
- [插件设置](#插件设置)

## 简介

博客园 vscode 插件，主要功能是将本地 markdown 文件对应到博文园中博文，从而让 vscode 用户可以一键发布 markdown 博文到博客园。

## 主要功能

### 登录 / 授权

要使用本插件发布 / 修改博文，需要先进行登录或授权操作。

<kbd><img src="https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228125556260-986735114.png" height="150"></kbd>

### 将本地 markdown 文件发布到博客园

<kbd><img src="https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130156308-187058889.png" height="550"></kbd>

<kbd><img src="https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130228248-172977703.png" height="550"></kbd>

若本地文件已经关联到一篇博客园博文，那么会直接更新这篇博文。

也通过 vscode 的 `Command Palette`（唤起 `Command Palette` 快捷键，windows：`ctrl+shift+p`，macos：`command+shift+p`）调用 `Cnblogs: 保存到博客园`命令，将当前正在编辑的 markdown 文件保存到博客园上

<kbd><img src="https://img2022.cnblogs.com/blog/1596066/202204/1596066-20220415194545998-874211959.png" height="550"></kbd>

### 博客园博文列表

当点击列表中的博文时，会自动将博文内容下载到工作空间一个本地文件中（此时这个本地文件就关联到了这篇博文），完成编辑后可以再将本地的内容保存到博客园博文

<kbd><img src="https://img2020.cnblogs.com/blog/3/202112/3-20211227184342642-1938639868.png" height="550"></kbd>

### 搜索博文

在博文列表的工具栏中, 包含一个搜索的图标, 点击这个图标可以触发搜索功能, 点击后会先要求输入关键词, 输入完成后按回车确认, 搜索结果将在列表中进行展示

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202210/35695-20221027141735814-276823372.png"></kbd>

列表中的 `搜索结果` 那一项的工具栏包含两个可以使用的命令, 分别是 `刷新搜索结果` 和 `清除搜索结果`; 也可以通过右键上下文菜单调用这两个命令

<kbd><img  src="https://img2022.cnblogs.com/blog/35695/202210/35695-20221027142035784-2094216229.png"></kbd>

### 将本地文件关联到博客园博文

一个本地文件可以关联到一篇博客园博文，本地文件必须在 `vscode-cnb.workspace` 配置的工作目录中

<kbd><img src="https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130049842-409512486.png" height="550"></kbd>

### 拉取远程博文内容更新本地文件

本地文件和博文关联后，如果通过博客后台更新了这篇博文，此时本地文件是不会自动更新的，但是可以通过 `Cnblogs: 拉取远程更新`命令来更新本地博文

可以在下面这些地方可以调用 `Cnblogs: 拉取远程更新`

- 博客园随笔列表视图中的博文的上下文菜单`拉取远程更新`（仅已关联本地文件的博文）
  
  <kbd><img src="https://img2022.cnblogs.com/blog/1596066/202204/1596066-20220415195826898-1477642941.png" height="350"></kbd>

- 编辑器上下文菜单中的`拉取远程更新`（仅针对 markdown 文件）
  
  <kbd><img src="https://img2022.cnblogs.com/blog/1596066/202204/1596066-20220415195920100-1395377363.png" height="550"></kbd>

- 文件浏览器上下文菜单中的`拉取远程更新`（仅针对 markdown 文件）
  
  <kbd><img src="https://img2022.cnblogs.com/blog/1596066/202204/1596066-20220401183918962-2083221618.png" height="550"></kbd>

- vscode 命令面板 `Cnblogs: 拉取远程更新`，此时会尝试去寻找当前正在编辑的文件对其进行更新
  
  <kbd><img src="https://img2022.cnblogs.com/blog/1596066/202204/1596066-20220401184013947-1481430186.png?v=20220424" height="550"></kbd>

在更新本地文件之前会弹出确认对话框，因为此操作会覆盖本地文件的内容，所以请谨慎使用。

### 图片上传

当 vscode 处于配置好的 `vscode-cnb` 工作空间时，可以通过快捷键，上下文菜单，编辑器工具栏等方式上传本地或剪贴板中的图片到博客园

<kbd><img src="https://img2020.cnblogs.com/blog/3/202112/3-20211223133219376-311354679.gif" height="550"></kbd>

### 博文分类管理

支持新建，删除（可批量操作），修改博客园博文分类

<kbd><img src="https://img2020.cnblogs.com/blog/1596066/202112/1596066-20211228130552877-1788018336.png" height="300"></kbd>

### 导出 pdf

支持将博文导出为 pdf 格式的文件到本地，此功能依赖于 [Chromium](https://www.chromium.org/chromium-projects/)，vscode-cnb 默认会先从本地寻找是否有已安装的 Chrome 或基于 Chromium 的 Edge 浏览器，若有的话则会直接使用本地的 Chrome 或基于 Chromium 的 Edge; 若未找到，那么会提示用户手动选择本地的 Chromium 或其他基于 Chromium 的浏览器

<kbd><img src="https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323135717910-1090211493.png" height="550"></kbd>

也可以在 vscode 的设置中手动配置 **Chromium 或其他基于 Chromium 的浏览器的可执行文件路径**，这个路径针对 windows 和 macos 是不同的两个配置，可以根据自己使用的系统进行配置

<kbd><img src="https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220323135918858-1619509502.png" height="350"></kbd>

列表中选择要导出的博文时, 支持多选

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202209/35695-20220907203200119-1667606464.png"></kbd>

### 提取图片

你可能会在markdown文件中使用本地的相对路径的图片, 将这样的markdown发布到博客园会导致图片无法正常展示, 为此我们提供了 `提取图片` 功能, 你可以通过编辑器的上下文菜单调用此功能

![image](https://img2022.cnblogs.com/blog/1596066/202209/1596066-20220917215536822-836105648.png)

也可以在设置中配置保存到博客园时自动提取图片

![image](https://img2022.cnblogs.com/blog/1596066/202209/1596066-20220917215650930-372126612.png)

此功能除了可以提取本地图片, 也可以提取其他承载在第三方图床中的图片

![image](https://img2022.cnblogs.com/blog/1596066/202209/1596066-20220917215802986-44248462.png)

此功能会上传图片到博客园然后替换源markdown文件中的图片链接

### 博文设置面板

首次发布本地 markdown 文件到博客园时，会打开博文设置面板允许编辑博文相关的设置

<kbd><img src="https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220331112748377-737262324.png" height="550"></kbd>

同时，也可以在博客园随笔列表视图，文件列表视图和 markdown 编辑器中上下文菜单中可以通过**博文设置**命令打开博文设置面板

<kbd><img src="https://img2022.cnblogs.com/blog/1596066/202203/1596066-20220331113211016-1457564407.png?v=202204242" height="550"></kbd>

### 闪存

支持通过快捷键 `ctrl+s ctrl+c`(windows) `cmd + s cmd+c`(mac) 调用发闪存命令, 发闪存前需要先编辑, 编辑完成后可以发布; 也可以在编辑器中选中一段文本或代码, 然后鼠标右键唤起上下文菜单, 可以将选中的内容发到闪存

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202211/35695-20221115143017664-1504226894.png" alt="" height="550"></kbd>

可以通过博客园导航视图中有 `发闪存` 按钮调用发闪存命令, 点击后会先要求编辑闪存, 编辑后可以发布

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202211/35695-20221115143240134-832955354.png" alt="" height="550"></kbd>

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202211/35695-20221115144008924-1453379990.png" alt=""></kbd>

编辑完成后回车会弹出确认框, 此时可以通过 `编辑内容` `编辑访问权限` `编辑标签` 按钮二次编辑

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202211/35695-20221115143733447-1514251853.png" height="550"></kbd>

也可以通过VSCode命令面板(`ctrl/cmd + p`唤起命令面板)调用发闪存命令

<kbd><img src="https://img2022.cnblogs.com/blog/35695/202211/35695-20221115144307251-1543702626.png" height="550"></kbd>

通过本插件发布的闪存, 在尾部会显示一个vscode图标

## vscode 版本要求

\>=1.62.0

## 插件设置

* `workspace`：`vscode-cnb` 需要用到的一个工作空间，`vscode-cnb` 只有检测到 vscode 处于此目录下才会生效，默认会使用 `~/Documents/Cnblogs` 作为工作空间

<kbd><img src="https://img2020.cnblogs.com/blog/3/202112/3-20211227183958436-462553661.png" height="150"></kbd>
