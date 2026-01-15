class TestAssertions {
  static assertTaskHasRequiredProperties(task) {
    expect(task).toHaveProperty("id");
    expect(task).toHaveProperty("title");
    expect(task).toHaveProperty("ownerId");
    expect(task).toHaveProperty("createdAt");
    expect(task).toHaveProperty("status");
    expect(task).toHaveProperty("priority");
    expect(task).toHaveProperty("category");
  }

  static assertUserHasRequiredProperties(user) {
    expect(user).toHaveProperty("id");
    expect(user).toHaveProperty("username");
    expect(user).toHaveProperty("email");
    expect(user).toHaveProperty("isActive");
    expect(user).toHaveProperty("createdAt");
  }

  static assertControllerResponse(response, shouldSucceed = true) {
    expect(response).toHaveProperty("success");
    expect(response.success).toBe(shouldSucceed);
    if (shouldSucceed) {
      const hasData = Object.prototype.hasOwnProperty.call(response, "data");
      const hasMessage = Object.prototype.hasOwnProperty.call(
        response,
        "message"
      );
      expect(hasData || hasMessage).toBe(true);
    } else {
      expect(response).toHaveProperty("error");
      expect(typeof response.error).toBe("string");
    }
  }

  static assertValidationResult(result, shouldBeValid, expectedErrors = []) {
    expect(result.isValid).toBe(shouldBeValid);
    if (!shouldBeValid) {
      expectedErrors.forEach((error) => {
        expect(result.errors).toContain(error);
      });
    }
  }
}

module.exports = TestAssertions;
