package com.example.demo

import jakarta.validation.Valid
import org.springframework.web.bind.annotation.PostMapping
import org.springframework.web.bind.annotation.RequestBody
import org.springframework.web.bind.annotation.RequestMapping
import org.springframework.web.bind.annotation.RestController

@RestController
@RequestMapping("/users")
class UserController(private val userService: UserService) {

    @PostMapping
    fun create(@RequestBody @Valid request: CreateUserRequest): UserResponse {
        return userService.create(request)
    }
}

data class CreateUserRequest(val name: String, val email: String)
data class UserResponse(val id: Long, val name: String, val email: String)
