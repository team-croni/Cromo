import type {
  FullConfig,
  FullResult,
  Reporter,
  Suite,
  TestCase,
  TestResult,
} from '@playwright/test/reporter';

/**
 * 커스텀 리포터: 테스트 반복 결과를 파일별로 상세하게 출력
 */
class RepeatReporter implements Reporter {
  // 파일별 결과를 저장하는 Map
  private fileResults: Map<string, Map<string, { passed: number; failed: number }>> = new Map();
  private totalRuns = 0;
  private totalPassed = 0;
  private totalFailed = 0;
  private repeatCount = 1;
  private currentFile = '';

  // ANSI 색상 코드
  private colors = {
    cyan: '\x1b[36m',
    green: '\x1b[32m',
    red: '\x1b[31m',
    yellow: '\x1b[33m',
    gray: '\x1b[90m',
    bold: '\x1b[1m',
    reset: '\x1b[0m',
  };

  private color(color: string, text: string): string {
    return `${this.colors[color as keyof typeof this.colors] || ''}${text}${this.colors.reset}`;
  }

  private green(text: string): string { return this.color('green', text); }
  private red(text: string): string { return this.color('red', text); }
  private yellow(text: string): string { return this.color('yellow', text); }
  private cyan(text: string): string { return this.color('cyan', text); }
  private gray(text: string): string { return this.color('gray', text); }
  private bold(text: string): string { return this.color('bold', text); }

  // 파일 경로에서 파일명만 추출
  private getFileName(filePath: string): string {
    const parts = filePath.split('/');
    return parts[parts.length - 1] || filePath;
  }

  onBegin(config: FullConfig, suite: Suite) {
    this.repeatCount = 1;
    this.totalRuns = 0;
    this.totalPassed = 0;
    this.totalFailed = 0;
    this.fileResults.clear();
    this.currentFile = '';

    console.log(this.cyan('\n========== E2E 테스트 시작 =========='));
    console.log(this.gray(`테스트 파일: ${suite.allTests().length}개\n`));
  }

  onTestBegin(test: TestCase, result: TestResult) {
    const testName = test.title;
    const filePath = test.location.file || 'unknown';
    const fileName = this.getFileName(filePath);

    // 파일이 변경되면 파일 헤더 출력
    if (fileName !== this.currentFile) {
      this.currentFile = fileName;
      console.log(this.cyan(`\n📁 ${fileName}`));
      console.log(this.gray('─'.repeat(40)));
    }

    // 파일별 결과 초기화
    if (!this.fileResults.has(fileName)) {
      this.fileResults.set(fileName, new Map());
    }

    const fileMap = this.fileResults.get(fileName);
    if (fileMap && !fileMap.has(testName)) {
      fileMap.set(testName, { passed: 0, failed: 0 });
    }
  }

  onTestEnd(test: TestCase, result: TestResult) {
    const testName = test.title;
    const filePath = test.location.file || 'unknown';
    const fileName = this.getFileName(filePath);
    const fileMap = this.fileResults.get(fileName);

    if (fileMap) {
      const testResult = fileMap.get(testName);

      if (testResult) {
        if (result.status === 'passed') {
          testResult.passed++;
          this.totalPassed++;
          console.log(this.green(`  ✓ ${testName}`));
        } else if (result.status === 'failed') {
          testResult.failed++;
          this.totalFailed++;
          console.log(this.red(`  ✗ ${testName}`));
          // 실패 시 에러 메시지 출력
          if (result.errors.length > 0) {
            const errorMsg = result.errors[0].message;
            console.log(this.red(`    └─ 에러: ${errorMsg.substring(0, 100)}...`));
          }
        }
      }
    }

    this.totalRuns++;
  }

  onEnd(result: FullResult) {
    console.log(this.cyan('\n========== 테스트 결과 =========='));
    console.log(this.gray(`실행 시간: ${result.duration}ms`));
    console.log(this.gray(`총 테스트 수: ${this.totalRuns}`));
    console.log(this.green(`성공: ${this.totalPassed}`));
    console.log(this.red(`실패: ${this.totalFailed}`));

    // 성공률 계산
    const successRate = this.totalRuns > 0 ? ((this.totalPassed / this.totalRuns) * 100).toFixed(1) : '0.0';
    const successRateNum = parseFloat(successRate);
    let successRateColored: string;
    if (successRateNum >= 80) {
      successRateColored = this.green(successRate + '%');
    } else if (successRateNum >= 50) {
      successRateColored = this.yellow(successRate + '%');
    } else {
      successRateColored = this.red(successRate + '%');
    }
    console.log(this.bold(`성공률: ${successRateColored}`));

    // 파일별 상세 결과
    console.log(this.cyan('\n========== 파일별 통계 =========='));
    for (const [fileName, fileMap] of this.fileResults) {
      // 파일별 통계
      let filePassed = 0;
      let fileFailed = 0;
      for (const [, testResult] of fileMap) {
        filePassed += testResult.passed;
        fileFailed += testResult.failed;
      }
      const fileTotal = filePassed + fileFailed;
      const fileRate = fileTotal > 0 ? ((filePassed / fileTotal) * 100).toFixed(1) : '0.0';
      const fileRateNum = parseFloat(fileRate);
      let fileRateColored: string;
      if (fileRateNum >= 80) {
        fileRateColored = this.green(fileRate + '%');
      } else if (fileRateNum >= 50) {
        fileRateColored = this.yellow(fileRate + '%');
      } else {
        fileRateColored = this.red(fileRate + '%');
      }

      console.log(this.bold(`📁 ${fileName}: ${this.gray(`${filePassed}/${fileTotal}`)} (${fileRateColored})`));
    }

    console.log(this.cyan('=====================================\n'));
  }
}

export default RepeatReporter;
