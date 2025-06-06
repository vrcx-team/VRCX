import getDeviceId from '../utils/deviceId';
import request from '../utils/requests';

class TaskQueue {
    constructor() {
        this.queue = [];
        this.isProcessing = false;
    }

    // 初始化：加载数据库中未完成的任务
    async init(db) {
        this.db = db;
        const pending = await this.db.getAllPendingTasks();
        this.queue.push(...pending);
        this._notify();
    }

    // 添加任务：存入 SQLite 并加入队列
    async addTask({ url, method, data, params }) {
        if (!data || data.length === 0) {
            return;
        }
        const task = {
            id: crypto.randomUUID(),
            url,
            method,
            data,
            params,
            retry: 0,
            status: 'pending',
            created_at: Date.now()
        };
        if (this.db) {
            await this.db.insertTask(task);
        }
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
            if (this.db) {
                await this.db.markTaskSuccess(task.id);
            }
        } catch (e) {
            console.error('上传任务失败:', e);
            task.retry++;
            if (task.retry < 3) {
                this.queue.push(task); // 重试
            } else {
                if (this.db) {
                    await this.db.markTaskFailed(task);
                }
            }
        }
        this._processNext();
    }

    // 实际上传请求
    async _upload(task) {
        let data = {};
        // 仅在 POST/PUT 请求中添加 deviceId，如需传递请使用 POST/PUT 请求
        // deviceId is only added in POST/PUT requests; use POST/PUT to send it.
        if (
            task.method.toUpperCase() === 'POST' ||
            task.method.toUpperCase() === 'PUT'
        ) {
            const deviceId = await getDeviceId();
            data = {
                data: task.data,
                deviceId
            };
        }
        await request({
            ...task,
            data
        });
    }
}
const toaskQueue = new TaskQueue();
export function initTaskQueue(db) {
    return toaskQueue.init(db);
}

export default function (data) {
    return toaskQueue.addTask(data);
}
