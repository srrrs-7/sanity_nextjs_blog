import { useState } from "react";
import { GetStaticProps } from "next";
import { useForm, SubmitHandler } from "react-hook-form";
import PortableText from "react-portable-text";

import { sanityClient, urlFor } from "../../sanity";
import { Post } from "../../typings"

import { Header } from "../../components/Header";


type FormInput = {
    _id: string;
    name: string;
    email: string;
    comment: string;
}

type Props = {
    post: Post;
}

const Post = ({ post }: Props) => {
    console.log(post);
    const[submitted, setSubmitted] = useState(false);
    const { register, handleSubmit, formState: {errors} } = useForm<FormInput>();

    const onSubmit: SubmitHandler<FormInput> = async(data) => {
        await fetch("/api/createComment", {
            method: "POST",
            body: JSON.stringify(data),
        }).then(() => {
            console.log(data);
            setSubmitted(true);
        }).catch((error) => {
            console.log(error);
            setSubmitted(false);
        })
    }

    return (
        <main>
            <Header />
            <img
                className="w-full h-80 object-cover"
                src={urlFor(post.mainImage.asset).url()!} 
                alt="mainImage" 
            />

            <article className="max-w-3xl mx-auto p-5">
                <h1 className="text-3xl mt-10 mb-3 font-serif">{post.title}</h1>
                <h2 className="text-xl font-light text-gray-500 mb-2 font-serif">{post.description}</h2>

                <div className="flex items-center space-x-2">
                    <img 
                        className="h-10 w-10 rounded-full"
                        src={urlFor(post.author.image).url()!} 
                        alt="authorImage" 
                    />
                    <p className="font-extralight text-sm">
                        Blog post by &nbsp;<span className="text-blue-600">{post.author.name}</span>&nbsp; &nbsp; - Published at {new Date(post._createdAt).toLocaleString()}
                    </p>
                </div>

                <div>
                    <PortableText
                        className="mt-10 "
                        dataset = {process.env.NEXT_PUBLIC_SANITY_DATASET!}
                        projectId = {process.env.NEXT_PUBLIC_SANITY_PROJECT_ID!}
                        content={post.body}
                        serializers={
                            {
                                h1: (props: any)=> (
                                    <h1 className="text-2xl font-bold my-5" {...props} />
                                ),
                                h2: (props: any)=> (
                                    <h1 className="text-xl font-bold my-5" {...props} />
                                ),
                                li: ({ children })=> (
                                    <li className="ml-4 list-disc">{children}</li>
                                        ),
                                link: ({ href, children })=> (
                                    <a href={href} className="text-blue-600 hover:underlined">
                                        {children}
                                    </a>
                                ),
                            }
                        }
                    />
                </div>
            </article>

            <hr className="max-w-3xl my-5 mx-auto border border-yellow-600"/>

            {submitted ? (
                <div className="flex flex-col py-5 my-5 items-center bg-yellow-600 text-white max-w-3xl mx-auto">
                    <h3 className="text-3xl text-bold font-serif">Thank you for submitting your comment!!</h3>
                    <p className="text-xl text-bold font-serif">Once it has been approved, it will appear below!</p>
                </div>
            ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col p-5 max-w-2xl mx-auto mb-10 font-serif">
                <h3 className="text-sm text-blue-600">Why don't you funny article ?</h3>
                <h4 className="text-3xl font-bold">Leave a comment </h4>
                <hr className="max-w-3xl py-3 mt-3" /> 

                <input 
                    {...register("_id")} 
                    type="hidden" 
                    name="_id" 
                    value={post._id} 
                />

                <label className="block mb-5">
                    <span className="text-gray-700">Name</span>
                    <input 
                        {...register("name", {required: true})} 
                        className="shadow border rounded py-2 px-3 form-input mt-2 block w-full outline-none focus:ring ring-yellow-300" 
                        type="text" 
                        placeholder="Name" 
                    />
                </label>
                <label className="block mb-5">
                    <span className="text-gray-700">Email</span>
                    <input 
                        {...register("email", {required: true})} 
                        className="shadow border rounded py-2 px-3 form-input mt-2 block w-full outline-none focus:ring ring-yellow-300" 
                        type="text" 
                        placeholder="Email" 
                    />
                </label>
                <label className="block mb-5">
                    <span className="text-gray-700">Comment</span>
                    <textarea 
                        {...register("comment", {required: true})} 
                        className="shadow border rounded py-2 px-3 w-full mt-2 block form-textarea outline-none focus:ring ring-yellow-300" 
                        placeholder="Comment" 
                        rows={6} 
                    />
                </label>

                <div className="flex flex-col p-2">
                    {errors.name && (
                        <span className="text-red-600">- The Name Field required</span>
                    )}
                    {errors.email && (
                        <span className="text-red-600">- The Email Field required</span>
                    )}
                    {errors.comment && (
                        <span className="text-red-600">- The Comment Field required</span>
                    )}
                </div>
                <input 
                    type="submit" 
                    className="shadow bg-blue-600 hover:bg-yellow-500 focus:shadow-outline focus:outline-none text-white py-2 px-4 rounded cursor-pointer"
                />
            </form>
            )}

            {/* Comments */}
            <div className="flex flex-col p-10 my-10 max-w-3xl mx-auto shadow shadow-blue-600 space-y-2">
                <h3 className="font-serif text-4xl">Comments</h3>
                <hr className="pb-2" />

                {post.comments.map((comment) => (
                    <div key={comment._id}>
                        <p className="font-serif">
                            <span className="text-blue-600 text-xl">{comment.name}</span> : {comment.comment}
                        </p>
                    </div>
                ))}
            </div>
        </main>
    );
}


export default Post;


//URL parameter retrieve  `localhost:3000/post/$slug`
export const getStaticPaths = async() => {
    const query = `*[_type == "post"]{
        _id,
        slug {
            current
        }
    }`;

    const posts = await sanityClient.fetch(query);

    const paths = posts.map((post: Post) => ({
        params: {
            slug: post.slug.current
        }
    }));

    return {paths, fallback: "blocking"};
};


// Get Data
export const getStaticProps: GetStaticProps = async({ params }) => {
    const query = `*[_type == "post" && slug.current == $slug][0]{
        _id,
        _createdAt,
        title,
        author -> {
            name,
            image
        },
        "comments": *[
            _type == "comment" &&
            post._ref == ^._id &&
            approved == true
        ],
        description,
        mainImage,
        slug,
        body
        }`;

    const post = await sanityClient.fetch(query, {
        slug: params?.slug,
    });

    if(!post){
        return {
            notFound: true
        }
    }

    return {
        props: {
            post
        },
        revalidate: 60,  // after 60 seconds, it'll update the old cached version
    }
};
