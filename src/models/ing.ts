export class Ing {
    id = -1;
    content = '';
    isPrivate = false;

    static parse(this: void, value: unknown): Ing {
        return Object.assign(new Ing(), typeof value === 'object' ? value : {});
    }
}

export type IngPublishModel = Pick<Ing, 'content' | 'isPrivate'>;
