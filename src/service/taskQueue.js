class TaskQueue {
    constructor(db) {
        this.db = db;
        this.queue = [];
        this.isProcessing = false;
    }

    // 初始化：加载数据库中未完成的任务
    async init() {
        const pending = await this.db.getAllPendingTasks();
        this.queue.push(...pending);
        this._notify();
    }

    // 添加任务：存入 SQLite 并加入队列
    async addTask({ url, method, data, params }) {
        const task = {
            id: crypto.randomUUID(),
            url,
            method,
            data,
            params,
            status: 'pending',
            created_at: Date.now()
        };
        await this.db.insertTask(task);
        this.queue.push(task);
        this._notify();
    }

    // 唤醒上传任务（如果没在上传）
    _notify() {
        if (!this.isProcessing) {
            this._processNext();
        }
    }

    // 顺序处理上传任务
    async _processNext() {
        if (this.queue.length === 0) {
            this.isProcessing = false;
            return;
        }
        this.isProcessing = true;

        const task = this.queue.shift();
        try {
            await this._upload(task);
            await this.db.markTaskSuccess(task.id);
        } catch (e) {
            task.retry++;
            if (task.retry < 3) {
                this.queue.push(task); // 重试
            } else {
                await this.db.markTaskFailed(task);
            }
        }
        this._processNext();
    }

    // 实际上传请求
    async _upload(task) {
        await window.DAPI({
            url: task.url,
            method: task.method,
            data: JSON.parse(task.data)
        });
    }
}