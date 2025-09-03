/**
 * Vue.js 앱을 초기화하고 실행하는 메인 함수
 * @function initializeVueApp
 * @description Vue 라이브러리 로딩을 대기하고 앱을 초기화합니다
 */

    const { createApp, onMounted } = Vue;
    const taskManager = new TaskManager();

    /**
     * Vue 앱 인스턴스 생성 및 설정
     * @description 컴포지션 API를 사용하여 반응형 상태와 메서드를 정의합니다
     */
    const app = createApp({
        setup() {
            /**
             * 컴포넌트 마운트 완료 시 실행되는 훅
             * @description Sortable 초기화를 처리합니다
             */
            onMounted(() => {
                // 드래그 앤 드롭 기능 초기화
                taskManager.initializeSortable();
            });

            // 템플릿에서 사용할 반응형 데이터와 메서드들을 반환
            return {
                // 반응형 상태
                tasks: taskManager.tasks,
                inputVisible: taskManager.inputVisible,
                newTaskText: taskManager.newTaskText,
                taskInput: taskManager.taskInput,
                
                // 메서드들
                toggleTask: (taskId) => taskManager.toggleTask(taskId),
                showInput: () => taskManager.showInput(),
                hideInput: () => taskManager.hideInput(),
                addTask: () => taskManager.addTask()
            };
        }
    });

    // Vue 앱을 DOM에 마운트
    app.mount('#app');
