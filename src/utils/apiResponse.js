/**
 * Standardized API response helper
 */
class ApiResponse {
    /**
     * Send success response
     */
    static success(res, data = null, message = 'Success', statusCode = 200) {
        return res.status(statusCode).json({
            success: true,
            message,
            data,
        });
    }

    /**
     * Send created response (201)
     */
    static created(res, data = null, message = 'Created successfully') {
        return this.success(res, data, message, 201);
    }

    /**
     * Send no content response (204)
     */
    static noContent(res) {
        return res.status(204).send();
    }

    /**
     * Send list response with pagination at root level
     */
    static list(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data,
            page: pagination.page,
            limit: pagination.limit,
            total: pagination.total,
            pages: pagination.pages,
        });
    }

    /**
     * Send paginated response
     */
    static paginated(res, data, pagination, message = 'Success') {
        return res.status(200).json({
            success: true,
            message,
            data,
            pagination: {
                currentPage: pagination.page,
                totalPages: Math.ceil(pagination.total / pagination.limit),
                totalItems: pagination.total,
                itemsPerPage: pagination.limit,
                hasNextPage: pagination.page < Math.ceil(pagination.total / pagination.limit),
                hasPrevPage: pagination.page > 1,
            },
        });
    }
}

module.exports = ApiResponse;

