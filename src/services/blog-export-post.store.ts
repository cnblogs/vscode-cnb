import { DownloadedBlogExport } from '@/models/blog-export';
import { ExportPost, ExportPostModel } from '@/models/blog-export/export-post';
import { DataTypes, Op, Sequelize } from 'sequelize';

import { Disposable } from 'vscode';

// eslint-disable-next-line @typescript-eslint/naming-convention
declare const __non_webpack_require__: (p: string) => object;

export class ExportPostStore implements Disposable {
    private _sequelize?: null | Sequelize;
    private _table?: typeof ExportPostModel | null;

    constructor(public readonly downloadedExport: DownloadedBlogExport) {}

    protected get sequelize() {
        if (this._sequelize != null) return this._sequelize;

        const {
            downloadedExport: { filePath },
        } = this;

        this._sequelize = new Sequelize({
            dialect: 'sqlite',
            storage: filePath,
            dialectModule: __non_webpack_require__('./assets/scripts/sqlite3/lib/sqlite3.js'),
            logging: (...msg) => (process.env.NODE_ENV?.toLowerCase() === 'development' ? console.log(msg) : undefined),
        });

        return this._sequelize;
    }

    protected get table(): typeof ExportPostModel {
        if (this._table) return this._table;

        const { sequelize } = this;
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
            { sequelize, tableName: 'blog_Content', timestamps: false }
        );
        return (this._table = ExportPostModel);
    }

    list(): Promise<ExportPost[]> {
        return this.table
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
            .then(data => data.map(x => x.dataValues));
    }

    getBody(id: number): Promise<string> {
        return this.table
            .findOne({
                where: {
                    id: {
                        [Op.eq]: id,
                    },
                },
                attributes: ['body'],
            })
            .then(x => x?.dataValues.body ?? '');
    }

    dispose() {
        this._sequelize?.close().catch(console.warn);
        this._sequelize = null;
        this._table = null;
    }
}
