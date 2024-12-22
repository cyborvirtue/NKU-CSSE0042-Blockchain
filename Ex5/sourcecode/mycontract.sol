// SPDX-License-Identifier: GPL-3.0
pragma solidity >=0.7.0 <0.9.0;

import "hardhat/console.sol";

/**
 * @title BlockchainSplitwise
 * @dev 实现基于区块链的债务记录和循环债务解决系统
 */
contract BlockchainSplitwise {
    // 状态变量
    mapping(address => mapping(address => uint32)) public lookup_table;  // 债务记录表
    address[] public users;  // 用户列表

    // 事件声明
    event IOUAdded(
        address indexed debtor,
        address indexed creditor,
        uint32 amount
    );

    /**
     * @dev 检查用户是否已存在
     * @param user 要检查的用户地址
     * @return bool 用户是否存在
     */
    function hasUser(address user) internal view returns (bool) {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == user) {
                return true;
            }
        }
        return false;
    }

    /**
     * @dev 查询债务金额
     * @param debtor 债务人地址
     * @param creditor 债权人地址
     * @return uint32 债务金额
     */
    function lookup(address debtor, address creditor) public view returns (uint32) {
        return lookup_table[debtor][creditor];
    }

    /**
     * @dev 添加欠条
     * @param creditor 债权人地址
     * @param amount 债务金额
     */
    function add_IOU(address creditor, uint32 amount) public {
        // 基本检查
        require(amount > 0, "Amount must be positive");
        require(creditor != msg.sender, "Debtor and creditor cannot be the same");
        require(creditor != address(0), "Invalid creditor address");

        // 更新债务
        uint32 current_debt = lookup_table[msg.sender][creditor];
        require(current_debt + amount >= current_debt, "Overflow check failed");
        lookup_table[msg.sender][creditor] = current_debt + amount;

        // 添加新用户
        if (!hasUser(msg.sender)) {
            users.push(msg.sender);
        }
        if (!hasUser(creditor)) {
            users.push(creditor);
        }

        // 触发事件
        emit IOUAdded(msg.sender, creditor, amount);

        // 尝试解决循环债务
        resolve_cycle(msg.sender, creditor);
    }

    /**
     * @dev 返回所有用户的地址列表
     * @return address[] 所有用户的地址数组
     */
    function getUsers() public view returns (address[] memory) {
        return users;
    }

    /**
     * @dev 解决循环债务
     * @param debtor 债务人地址
     * @param creditor 债权人地址
     */
    function resolve_cycle(address debtor, address creditor) internal {
        bool[] memory visited = new bool[](users.length);
        address[] memory path = new address[](users.length);
        
        // 初始化访问记录
        for (uint i = 0; i < users.length; i++) {
            visited[i] = false;
        }

        // 查找并解决循环债务
        find_cycle(debtor, creditor, visited, path, 0);
    }

    /**
     * @dev 查找债务循环
     * @param start 起始用户
     * @param current 当前用户
     * @param visited 访问记录
     * @param path 路径记录
     * @param path_length 当前路径长度
     */
    function find_cycle(
        address start,
        address current,
        bool[] memory visited,
        address[] memory path,
        uint path_length
    ) internal {
        uint current_index = get_user_index(current);
        
        if (visited[current_index]) {
            return;
        }

        visited[current_index] = true;
        path[path_length] = current;
        path_length++;

        // 遍历所有用户寻找债务关系
        for (uint i = 0; i < users.length; i++) {
            address next = users[i];
            if (lookup_table[current][next] > 0) {
                if (next == start && path_length > 2) {
                    // 找到循环，解决债务
                    resolve_path(path, path_length);
                } else {
                    find_cycle(start, next, visited, path, path_length);
                }
            }
        }

        visited[current_index] = false;
    }

    /**
     * @dev 获取用户在数组中的索引
     * @param user 用户地址
     * @return uint 用户索引
     */
    function get_user_index(address user) internal view returns (uint) {
        for (uint i = 0; i < users.length; i++) {
            if (users[i] == user) {
                return i;
            }
        }
        revert("User not found");
    }

    /**
     * @dev 解决路径上的债务
     * @param path 债务路径
     * @param path_length 路径长度
     */
    function resolve_path(address[] memory path, uint path_length) internal {
        // 找到最小债务金额
        uint32 min_debt = type(uint32).max;
        for (uint i = 0; i < path_length - 1; i++) {
            uint32 debt = lookup_table[path[i]][path[i + 1]];
            if (debt < min_debt) {
                min_debt = debt;
            }
        }

        // 减少路径上的所有债务
        for (uint i = 0; i < path_length - 1; i++) {
            lookup_table[path[i]][path[i + 1]] -= min_debt;
        }
    }
}
