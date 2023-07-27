import { DownloadedBlogExport } from '@/model/blog-export'
import { ExportPostModel } from '@/model/blog-export/export-post'
import { DataTypes, Op, Sequelize } from 'sequelize'
import { Disposable } from 'vscode'
import sqlite3 from 'sqlite3'
import { isDevEnv } from '@/model/config'

export class ExportPostStore implements Disposable {
    private _sequelize = new Sequelize({
        dialect: 'sqlite',
        storage: this.downloadedExport.filePath,
        dialectModule: sqlite3,
        logging: (...msg) => (isDevEnv() ? console.log(msg) : undefined),
    })

    private _table = ExportPostModel

    constructor(public readonly downloadedExport: DownloadedBlogExport) {
        ExportPostModel.init(
            {
                id: {
                    type: DataTypes.NUMBER,
                    field: 'Id',
                    primaryKey: true,
                    autoIncrement: true,
                },
                title: {
                    type: DataTypes.STRING,
                    field: 'Title',
                },
                blogId: { type: DataTypes.NUMBER, field: 'BlogId', allowNull: false },
                datePublished: {
                    type: DataTypes.DATE,
                    field: 'DateAdded',
                    allowNull: false,
                },
                dateUpdated: {
                    type: DataTypes.DATE,
                    field: 'DateUpdated',
                    allowNull: false,
                },
                isMarkdown: {
                    type: DataTypes.BOOLEAN,
                    field: 'IsMarkdown',
                    allowNull: false,
                },
                accessPermission: {
                    type: DataTypes.NUMBER,
                    field: 'AccessPermission',
                    allowNull: false,
                },
                entryName: {
                    type: DataTypes.STRING,
                    field: 'EntryName',
                    allowNull: true,
                },
                postType: {
                    type: DataTypes.ENUM('BlogPost', 'Article'),
                    field: 'PostType',
                    allowNull: false,
                },
                body: {
                    type: DataTypes.STRING,
                    field: 'Body',
                    allowNull: false,
                },
            },
            { sequelize: this._sequelize, tableName: 'blog_Content', timestamps: false }
        )
    }

    list() {
        return this._table
            .findAll({
                where: {
                    postType: {
                        [Op.eq]: 'BlogPost',
                    },
                },
                order: [['id', 'desc']],
                limit: 1000,
                attributes: {
                    exclude: ['body'],
                },
            })
            .then(data => data.map(x => x.dataValues))
    }

    getBody(id: number) {
        return this._table
            .findOne({
                where: {
                    id: {
                        [Op.eq]: id,
                    },
                },
                attributes: ['body'],
            })
            .then(x => x?.dataValues.body ?? '')
    }

    dispose() {
        this._sequelize?.close().catch(console.warn)
    }
}
