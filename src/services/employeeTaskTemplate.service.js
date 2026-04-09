const EmployeeTaskTemplate = require('../models/employeeTaskTemplate.model');

const getAll = async ({ page = 1, limit = 100, search = '' } = {}) => {
    const query = { isActive: true };
    if (search) {
        query.$or = [{ title: { $regex: search, $options: 'i' } }];
    }

    const skip = (Number(page) - 1) * Number(limit);
    const [data, total] = await Promise.all([
        EmployeeTaskTemplate.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
        EmployeeTaskTemplate.countDocuments(query),
    ]);

    return { data, total, page: Number(page), limit: Number(limit), pages: Math.ceil(total / Number(limit)) };
};

const create = async (data) => {
    const { title, description, priority, subtasks, notes } = data;
    const template = await EmployeeTaskTemplate.create({ title, description, priority, subtasks, notes });
    return template;
};

const update = async (id, data) => {
    const { title, description, priority, subtasks, notes } = data;
    const template = await EmployeeTaskTemplate.findOneAndUpdate(
        { _id: id, isActive: true },
        { title, description, priority, subtasks, notes },
        { new: true, runValidators: true }
    );
    if (!template) throw new Error('Template not found');
    return template;
};

const deleteTemplate = async (id) => {
    const template = await EmployeeTaskTemplate.findOneAndUpdate(
        { _id: id, isActive: true },
        { isActive: false },
        { new: true }
    );
    if (!template) throw new Error('Template not found');
};

module.exports = { getAll, create, update, deleteTemplate };
