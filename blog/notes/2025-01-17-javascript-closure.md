---
title: JavaScript闭包详解
date: 2025-01-17
category: note
tags: [JavaScript, 前端, 概念]
excerpt: 深入理解JavaScript闭包的概念、原理和应用场景。
---

# JavaScript闭包详解

## 什么是闭包？

闭包（Closure）是JavaScript中一个重要的概念。简单来说，**闭包就是能够访问其他函数作用域中变量的函数**。

## 基本示例

```javascript
function outer() {
    const message = 'Hello';

    function inner() {
        console.log(message); // 可以访问外部函数的变量
    }

    return inner;
}

const myFunc = outer();
myFunc(); // 输出: Hello
```

## 闭包的特点

1. **函数嵌套**: 内部函数可以访问外部函数的变量
2. **变量持久化**: 即使外部函数已经返回，内部函数仍然保持对外部变量的引用
3. **独立作用域**: 每次调用外部函数都会创建新的闭包

## 常见应用场景

### 1. 数据封装和私有变量

```javascript
function createCounter() {
    let count = 0; // 私有变量

    return {
        increment() {
            count++;
            return count;
        },
        decrement() {
            count--;
            return count;
        },
        getCount() {
            return count;
        }
    };
}

const counter = createCounter();
console.log(counter.increment()); // 1
console.log(counter.increment()); // 2
console.log(counter.getCount());  // 2
```

### 2. 函数工厂

```javascript
function makeMultiplier(multiplier) {
    return function(number) {
        return number * multiplier;
    };
}

const double = makeMultiplier(2);
const triple = makeMultiplier(3);

console.log(double(5)); // 10
console.log(triple(5)); // 15
```

### 3. 回调函数和事件处理

```javascript
function setupButton(buttonId, message) {
    const button = document.getElementById(buttonId);

    button.addEventListener('click', function() {
        alert(message); // 闭包保存了message变量
    });
}

setupButton('btn1', 'Button 1 clicked');
setupButton('btn2', 'Button 2 clicked');
```

## 注意事项

### 内存泄漏

闭包会保持对外部变量的引用，可能导致内存无法及时释放：

```javascript
function badExample() {
    const bigData = new Array(1000000);

    return function() {
        // 即使不使用bigData，它也不会被垃圾回收
        console.log('Hello');
    };
}
```

**解决方案**: 不需要时主动解除引用

```javascript
function goodExample() {
    const bigData = new Array(1000000);

    return function() {
        // 使用完后置为null
        bigData = null;
        console.log('Hello');
    };
}
```

## 总结

- 闭包是JavaScript中强大的特性
- 合理使用可以实现数据封装和函数工厂等模式
- 注意避免内存泄漏
- 理解闭包有助于编写更高质量的代码

## 扩展阅读

- [MDN - 闭包](https://developer.mozilla.org/zh-CN/docs/Web/JavaScript/Closures)
- [You Don't Know JS - Scope & Closures](https://github.com/getify/You-Dont-Know-JS)
