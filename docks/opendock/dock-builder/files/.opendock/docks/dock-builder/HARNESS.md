# Dock Builder Harness

평소에는 대상 Dock만 정적 검사합니다.

```bash
node .opendock/harness/dock-builder/check.mjs docks/opendock/<dock-name>
```

사용자가 `검수`, `ultrawork`, `release`를 요청한 경우에만 정밀 모드를 사용합니다.

```bash
node .opendock/harness/dock-builder/check.mjs --release docks/opendock/<dock-name>
```

정밀 모드는 Dock Builder 설치 파일과 대상 Dock 정책을 함께 확인합니다. 실제 install, update, doctor, uninstall과 Tool Dock의 실제 명령 실행은 임시 workspace에서 별도로 증거를 남깁니다.

인자를 생략한 일반 실행은 Dock Builder 설치 상태만 빠르게 확인하며, 저장소의 모든 Dock을 자동으로 검사하지 않습니다.
