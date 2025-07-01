"use client";

import { useRef, useState } from "react";
import { useLocalStorage } from "@/lib/useLocalStorage";

interface Todo {
  id: number;
  text: string;
  completed: boolean;
}

const STORAGE_KEY = "todo-list-v01";

export default function TodoPage() {
  const [todos, setTodos] = useLocalStorage<Todo[]>(STORAGE_KEY, []);
  const [input, setInput] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // 할 일 추가
  const addTodo = () => {
    const text = input.trim();
    if (!text) return;
    setTodos([...todos, { id: Date.now(), text, completed: false }]);
    setInput("");
    inputRef.current?.focus();
  };

  // 할 일 삭제
  const deleteTodo = (id: number) => {
    setTodos(todos.filter((todo) => todo.id !== id));
  };

  // 완료 체크
  const toggleTodo = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // 전체 삭제
  const clearAll = () => {
    if (window.confirm("정말 전체 삭제하시겠습니까?")) {
      setTodos([]);
    }
  };

  // 엔터로 추가
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") addTodo();
  };

  const leftCount = todos.filter((t) => !t.completed).length;

  return (
    <div className="p-6 max-w-[920px] mx-auto">
      <h1 className="text-2xl">TODO 리스트</h1>

      <div className="mt-4 flex flex-col w-full">
        {/* 입력 폼 */}
        <div className="modern-border p-4 bg-gray-50">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            할 일을 입력하고 엔터를 눌러 추가하세요
          </label>
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              className="flex-1 modern-border-sm p-2 focus:outline-none"
              placeholder="할 일을 입력하세요"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <button
              onClick={addTodo}
              className="bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 transition"
            >
              추가
            </button>
          </div>
        </div>

        {/* TODO 목록 */}
        <div className="mt-6">
          <div className="flex justify-between items-center">
            <h2 className="text-lg">할 일 목록</h2>
            <div className="text-sm text-gray-500">
              남은 할 일: <b>{leftCount}</b>개
            </div>
          </div>

          <div className="mt-2">
            {todos.length === 0 ? (
              <div className="modern-border p-4 bg-gray-50 text-gray-400 text-center">
                할 일이 없습니다.
              </div>
            ) : (
              <div className="space-y-2">
                {todos.map((todo) => (
                  <div
                    key={todo.id}
                    className="flex items-center bg-white modern-border px-3 py-2 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      onChange={() => toggleTodo(todo.id)}
                      className="mr-3 accent-gray-600 w-5 h-5"
                    />
                    <span
                      className={`flex-1 text-base ${
                        todo.completed ? "line-through text-gray-400" : ""
                      }`}
                    >
                      {todo.text}
                    </span>
                    <button
                      onClick={() => deleteTodo(todo.id)}
                      className="ml-2 text-gray-400 hover:text-red-500 transition"
                      aria-label="삭제"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 전체 삭제 버튼 */}
        {todos.length > 0 && (
          <div className="mt-6 flex justify-end">
            <button
              onClick={clearAll}
              className="px-3 py-1 rounded bg-red-100 text-red-600 hover:bg-red-200 transition"
            >
              전체 삭제
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
