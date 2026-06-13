package com.example.demo

import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

@Service
class UserService(private val userRepository: UserRepository) {

    @Transactional
    fun create(request: CreateUserRequest): UserResponse {
        val user = User(name = request.name, email = request.email)
        val saved = userRepository.save(user)
        return UserResponse(id = saved.id, name = saved.name, email = saved.email)
    }
}
