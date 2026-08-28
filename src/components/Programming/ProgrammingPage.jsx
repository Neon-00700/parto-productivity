import React from 'react';
import TodoList from '../Common/TodoList';
import { useApp } from '../../contexts/AppContext';

export default function ProgrammingPage() {
  const { data } = useApp();
  return <TodoList section="programming" tagOptions={data.customTags} />;
}
